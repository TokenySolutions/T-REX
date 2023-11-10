import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { Event } from 'ethers';
import OnchainID from '@onchain-id/solidity';
import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('TREXFactory', () => {
  describe('.deployTREXSuite()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer, anotherWallet },
          factories: { trexFactory },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(
          trexFactory.connect(anotherWallet).deployTREXSuite(
            'salt',
            {
              owner: deployer.address,
              name: 'Token name',
              symbol: 'SYM',
              decimals: 8,
              irs: ethers.constants.AddressZero,
              ONCHAINID: ethers.constants.AddressZero,
              irAgents: [],
              tokenAgents: [],
              complianceModules: [],
              complianceSettings: [],
            },
            {
              claimTopics: [],
              issuers: [],
              issuerClaims: [],
            },
          ),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when called by owner', () => {
      describe('when salt was already used', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await trexFactory.connect(deployer).deployTREXSuite(
            'salt',
            {
              owner: deployer.address,
              name: 'Token name',
              symbol: 'SYM',
              decimals: 8,
              irs: ethers.constants.AddressZero,
              ONCHAINID: ethers.constants.AddressZero,
              irAgents: [],
              tokenAgents: [],
              complianceModules: [],
              complianceSettings: [],
            },
            {
              claimTopics: [],
              issuers: [],
              issuerClaims: [],
            },
          );

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('token already deployed');
        });
      });

      describe('when claim pattern is not valid', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [ethers.constants.AddressZero],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('claim pattern not valid');
        });
      });

      describe('when configuring more than 5 claim issuers', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: Array.from({ length: 6 }, () => ethers.constants.AddressZero),
                issuerClaims: Array.from({ length: 6 }, () => []),
              },
            ),
          ).to.be.revertedWith('max 5 claim issuers at deployment');
        });
      });

      describe('when configuring more than 5 claim topics', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: Array.from({ length: 6 }, () => ethers.constants.HashZero),
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('max 5 claim topics at deployment');
        });
      });

      describe('when configuring more than 5 agents', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: Array.from({ length: 6 }, () => ethers.constants.AddressZero),
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('max 5 agents at deployment');
        });
      });

      describe('when configuring more than 30 compliance modules', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: Array.from({ length: 31 }, () => ethers.constants.AddressZero),
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('max 30 module actions at deployment');
        });
      });

      describe('when compliance configuration is not valid', () => {
        it('should revert', async () => {
          const {
            accounts: { deployer },
            factories: { trexFactory },
          } = await loadFixture(deployFullSuiteFixture);

          await expect(
            trexFactory.connect(deployer).deployTREXSuite(
              'salt',
              {
                owner: deployer.address,
                name: 'Token name',
                symbol: 'SYM',
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: ['0x00'],
              },
              {
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWith('invalid compliance pattern');
        });
      });

      describe('when configuration is valid', () => {
        it('should deploy a new suite', async () => {
          const {
            accounts: { deployer, aliceWallet, bobWallet },
            factories: { trexFactory, identityFactory },
            suite: { claimIssuerContract },
          } = await loadFixture(deployFullSuiteFixture);

          const countryAllowModule = await ethers.deployContract('CountryAllowModule');

          const tx = await trexFactory.connect(deployer).deployTREXSuite(
            'salt',
            {
              owner: deployer.address,
              name: 'Token name',
              symbol: 'SYM',
              decimals: 8,
              irs: ethers.constants.AddressZero,
              ONCHAINID: ethers.constants.AddressZero,
              irAgents: [aliceWallet.address],
              tokenAgents: [bobWallet.address],
              complianceModules: [countryAllowModule.address],
              complianceSettings: [
                new ethers.utils.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
                  [42, 66],
                ]),
              ],
            },
            {
              claimTopics: [ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEMO_TOPIC'))],
              issuers: [claimIssuerContract.address],
              issuerClaims: [[ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEMO_TOPIC'))]],
            },
          );
          expect(tx).to.emit(trexFactory, 'TREXSuiteDeployed');
          expect(tx).to.emit(identityFactory, 'Deployed');
          expect(tx).to.emit(identityFactory, 'TokenLinked');
        });
      });
    });
  });

  describe('.getToken()', () => {
    describe('when salt was used to deploy a token', () => {
      it('should return the token address', async () => {
        const {
          accounts: { deployer },
          factories: { trexFactory },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await trexFactory.connect(deployer).deployTREXSuite(
          'salt',
          {
            owner: deployer.address,
            name: 'Token name',
            symbol: 'SYM',
            decimals: 8,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            irAgents: [],
            tokenAgents: [],
            complianceModules: [],
            complianceSettings: [],
          },
          {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
          },
        );

        const receipt = await tx.wait();
        const tokenAddressExpected = receipt.events.find((event: Event) => event.event === 'TREXSuiteDeployed').args[0];

        const tokenAddress = await trexFactory.getToken('salt');
        expect(tokenAddress).to.equal(tokenAddressExpected);
      });
    });
  });

  describe('.setIdFactory()', () => {
    describe('when try to input address 0', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer },
          factories: { trexFactory },
        } = await loadFixture(deployFullSuiteFixture);

        await expect(trexFactory.connect(deployer).setIdFactory(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
      });
    });
    describe('when try to input a valid address', () => {
      it('should set new Id Factory', async () => {
        const {
          accounts: { deployer },
          factories: { trexFactory },
          authorities: { identityImplementationAuthority },
        } = await loadFixture(deployFullSuiteFixture);

        const newIdFactory = await new ethers.ContractFactory(OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, deployer).deploy(
          identityImplementationAuthority.address,
        );

        const tx = await trexFactory.setIdFactory(newIdFactory.address);
        expect(tx).to.emit(trexFactory, 'IdFactorySet');
        expect(await trexFactory.getIdFactory()).to.equal(newIdFactory.address);
      });
    });
  });

  describe('.recoverContractOwnership()', () => {
    describe('when sender is not owner', () => {
      it('should revert', async () => {
        const {
          accounts: { deployer, aliceWallet },
          factories: { trexFactory },
        } = await loadFixture(deployFullSuiteFixture);

        const tx = await trexFactory.connect(deployer).deployTREXSuite(
          'salt',
          {
            owner: deployer.address,
            name: 'Token name',
            symbol: 'SYM',
            decimals: 8,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            irAgents: [],
            tokenAgents: [],
            complianceModules: [],
            complianceSettings: [],
          },
          {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
          },
        );

        const receipt = await tx.wait();
        const tokenAddress = receipt.events.find((event: Event) => event.event === 'TREXSuiteDeployed').args[0];

        await expect(trexFactory.connect(aliceWallet).recoverContractOwnership(tokenAddress, aliceWallet.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });

    describe('when sender is owner and factory owns the trex contract', () => {
      it('should transfer ownership on the desired contract', async () => {
        const {
          accounts: { deployer, aliceWallet },
          factories: { trexFactory },
        } = await loadFixture(deployFullSuiteFixture);

        const deployTx = await trexFactory.connect(deployer).deployTREXSuite(
          'salt',
          {
            owner: trexFactory.address,
            name: 'Token name',
            symbol: 'SYM',
            decimals: 8,
            irs: ethers.constants.AddressZero,
            ONCHAINID: ethers.constants.AddressZero,
            irAgents: [],
            tokenAgents: [],
            complianceModules: [],
            complianceSettings: [],
          },
          {
            claimTopics: [],
            issuers: [],
            issuerClaims: [],
          },
        );

        const receipt = await deployTx.wait();
        const tokenAddress = receipt.events.find((event: Event) => event.event === 'TREXSuiteDeployed').args[0];

        const tx = await trexFactory.connect(deployer).recoverContractOwnership(tokenAddress, aliceWallet.address);

        const token = await ethers.getContractAt('Token', tokenAddress);

        await expect(tx).to.emit(token, 'OwnershipTransferred').withArgs(trexFactory.address, aliceWallet.address);

        await expect(token.owner()).to.eventually.eq(aliceWallet.address);
      });
    });
  });
});
