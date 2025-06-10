import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { Token } from '../../typechain-types';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('Token - Permit', () => {
  const value = 42n;
  const nonce = 0n;
  const maxDeadline = ethers.MaxUint256;

  async function getDomain(token: Token) {
    return {
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: token.target.toString(),
      name: await token.name(),
      version: await token.version(),
    };
  }

  async function buildData(token: Token, owner: SignerWithAddress, spender: SignerWithAddress, deadline = maxDeadline) {
    const domain = await getDomain(token);
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
    const message = {
      owner: owner.address,
      spender: spender.address,
      value,
      nonce,
      deadline,
    };

    return { domain, types, message };
  }

  describe('Initial state', () => {
    it('initial nonce is 0', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet, anotherWallet },
      } = await loadFixture(deployFullSuiteFixture);

      expect(await token.nonces(aliceWallet)).to.equal(0n);
      expect(await token.nonces(bobWallet)).to.equal(0n);
      expect(await token.nonces(anotherWallet)).to.equal(0n);

      console.log(await token.eip712Domain());
    });

    it('domain separator', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);

      const hashedDomain = ethers.TypedDataEncoder.hashDomain(await getDomain(token));

      expect(await token.DOMAIN_SEPARATOR()).to.equal(hashedDomain);
    });
  });

  describe('Permit', () => {
    it('accepts owner signature', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const { v, r, s } = await buildData(token, aliceWallet, bobWallet)
        .then(({ domain, types, message }) => aliceWallet.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await token.permit(aliceWallet, bobWallet, value, maxDeadline, v, r, s);

      expect(await token.nonces(aliceWallet)).to.equal(1n);
      expect(await token.allowance(aliceWallet, bobWallet)).to.equal(value);
    });

    it('rejects reused signature', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const { v, r, s, serialized } = await buildData(token, aliceWallet, bobWallet)
        .then(({ domain, types, message }) => aliceWallet.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await token.permit(aliceWallet, bobWallet, value, maxDeadline, v, r, s);

      const recovered = await buildData(token, aliceWallet, bobWallet).then(({ domain, types, message }) =>
        ethers.verifyTypedData(domain, types, { ...message, nonce: nonce + 1n, deadline: maxDeadline }, serialized),
      );

      await expect(token.permit(aliceWallet, bobWallet, value, maxDeadline, v, r, s))
        .to.be.revertedWithCustomError(token, 'ERC2612InvalidSigner')
        .withArgs(recovered, aliceWallet);
    });

    it('rejects other signature', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const { v, r, s } = await buildData(token, aliceWallet, bobWallet)
        .then(({ domain, types, message }) => bobWallet.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(token.permit(aliceWallet, bobWallet, value, maxDeadline, v, r, s))
        .to.be.revertedWithCustomError(token, 'ERC2612InvalidSigner')
        .withArgs(bobWallet, aliceWallet);
    });

    it('rejects expired permit', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const deadline = (await time.latest().then(ethers.toBigInt)) - BigInt(time.duration.weeks(1));

      const { v, r, s } = await buildData(token, aliceWallet, bobWallet, deadline)
        .then(({ domain, types, message }) => aliceWallet.signTypedData(domain, types, message))
        .then(ethers.Signature.from);

      await expect(token.permit(aliceWallet, bobWallet, value, deadline, v, r, s))
        .to.be.revertedWithCustomError(token, 'ERC2612ExpiredSignature')
        .withArgs(deadline);
    });
  });
});
