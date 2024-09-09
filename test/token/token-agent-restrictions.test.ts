import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('Token - Agent Restrictions', () => {
  describe('.setAgentRestrictions()', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet, tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(
          token.connect(anotherWallet).setAgentRestrictions(tokenAgent.address, {
            disableAddressFreeze: true,
            disableBurn: true,
            disableForceTransfer: true,
            disableMint: true,
            disablePartialFreeze: true,
            disablePause: true,
            disableRecovery: true,
          }),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when the caller is the owner', () => {
      describe('when the given address is not agent', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { anotherWallet },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(
            token.setAgentRestrictions(anotherWallet.address, {
              disableAddressFreeze: true,
              disableBurn: true,
              disableForceTransfer: true,
              disableMint: true,
              disablePartialFreeze: true,
              disablePause: true,
              disableRecovery: true,
            }),
          ).to.be.revertedWithCustomError(token, `AddressNotAgent`);
        });
      });

      describe('when the given address is an agent', () => {
        it('should set restrictions', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(
            token.setAgentRestrictions(tokenAgent.address, {
              disableAddressFreeze: true,
              disableBurn: true,
              disableForceTransfer: true,
              disableMint: true,
              disablePartialFreeze: true,
              disablePause: true,
              disableRecovery: true,
            }),
          )
            .to.emit(token, 'AgentRestrictionsSet')
            .withArgs(tokenAgent.address, true, true, true, true, true, true, true);
        });
      });
    });
  });

  describe('.getAgentRestrictions()', () => {
    it('should return restrictions', async () => {
      const {
        suite: { token },
        accounts: { tokenAgent },
      } = await loadFixture(deployFullSuiteFixture);

      await token.setAgentRestrictions(tokenAgent.address, {
        disableAddressFreeze: true,
        disableBurn: true,
        disableForceTransfer: true,
        disableMint: true,
        disablePartialFreeze: true,
        disablePause: true,
        disableRecovery: true,
      });

      const restrictions = await token.getAgentRestrictions(tokenAgent.address);
      expect(restrictions.disableAddressFreeze).to.be.true;
      expect(restrictions.disableBurn).to.be.true;
      expect(restrictions.disableForceTransfer).to.be.true;
      expect(restrictions.disableMint).to.be.true;
      expect(restrictions.disablePartialFreeze).to.be.true;
      expect(restrictions.disablePause).to.be.true;
      expect(restrictions.disableRecovery).to.be.true;
    });
  });
});
