import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

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
            factories: { trexFactory },
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
        });
      });
    });
  });
});
