import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import OnchainID from '@onchain-id/solidity';
import { expect } from 'chai';
import type { EventLog, ContractTransactionResponse } from 'ethers';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('TREXFactory', () => {
  async function getTREXSuiteDeployedTokenAddress(tx: ContractTransactionResponse): Promise<string> {
    const receipt = await tx.wait();
    if (!receipt) throw new Error('ContractTransactionReceipt is null');

    const event = receipt.logs.find(e => (e as EventLog)?.fragment?.name === 'TREXSuiteDeployed') as EventLog;
    if (!event) throw new Error('TREXSuiteDeployed event not found');

    return event.args[0];
  }

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
              irs: ethers.ZeroAddress,
              ONCHAINID: ethers.ZeroAddress,
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
        ).to.be.revertedWithCustomError(trexFactory, 'OwnableUnauthorizedAccount');
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
              irs: ethers.ZeroAddress,
              ONCHAINID: ethers.ZeroAddress,
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
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
          ).to.be.revertedWithCustomError(trexFactory, 'TokenAlreadyDeployed');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [ethers.ZeroAddress],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWithCustomError(trexFactory, 'InvalidClaimPattern');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: Array.from({ length: 6 }, () => ethers.ZeroAddress),
                issuerClaims: Array.from({ length: 6 }, () => []),
              },
            ),
          ).to.be.revertedWithCustomError(trexFactory, 'MaxClaimIssuersReached');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              },
              {
                claimTopics: Array.from({ length: 6 }, () => ethers.ZeroHash),
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWithCustomError(trexFactory, 'MaxClaimTopicsReached');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
                irAgents: Array.from({ length: 6 }, () => ethers.ZeroAddress),
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
          ).to.be.revertedWithCustomError(trexFactory, 'MaxAgentsReached');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
                irAgents: [],
                tokenAgents: [],
                complianceModules: Array.from({ length: 31 }, () => ethers.ZeroAddress),
                complianceSettings: [],
              },
              {
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              },
            ),
          ).to.be.revertedWithCustomError(trexFactory, 'MaxModuleActionsReached');
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
                irs: ethers.ZeroAddress,
                ONCHAINID: ethers.ZeroAddress,
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
          ).to.be.revertedWithCustomError(trexFactory, 'InvalidCompliancePattern');
        });
      });

      describe('when configuration is valid', () => {
        it('should deploy a new suite', async () => {
          const {
            accounts: { deployer, aliceWallet, bobWallet },
            factories: { trexFactory, identityFactory },
            suite: { claimIssuerContract },
          } = await loadFixture(deployFullSuiteFixture);

          const testModule = await ethers.deployContract('TestModule');

          const tx = await trexFactory.connect(deployer).deployTREXSuite(
            'salt',
            {
              owner: deployer.address,
              name: 'Token name',
              symbol: 'SYM',
              decimals: 8,
              irs: ethers.ZeroAddress,
              ONCHAINID: ethers.ZeroAddress,
              irAgents: [aliceWallet.address],
              tokenAgents: [bobWallet.address],
              complianceModules: [testModule.target],
              complianceSettings: [new ethers.Interface(['function blockModule(bool _blocked)']).encodeFunctionData('blockModule', [true])],
            },
            {
              claimTopics: [ethers.keccak256(ethers.toUtf8Bytes('DEMO_TOPIC'))],
              issuers: [claimIssuerContract.target],
              issuerClaims: [[ethers.keccak256(ethers.toUtf8Bytes('DEMO_TOPIC'))]],
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
            irs: ethers.ZeroAddress,
            ONCHAINID: ethers.ZeroAddress,
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

        const tokenAddressExpected = await getTREXSuiteDeployedTokenAddress(tx);

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

        await expect(trexFactory.connect(deployer).setIdFactory(ethers.ZeroAddress)).to.be.revertedWithCustomError(trexFactory, 'ZeroAddress');
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
          identityImplementationAuthority.target,
        );

        const tx = await trexFactory.setIdFactory(newIdFactory.target);
        expect(tx).to.emit(trexFactory, 'IdFactorySet');
        expect(await trexFactory.getIdFactory()).to.equal(newIdFactory.target);
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
            irs: ethers.ZeroAddress,
            ONCHAINID: ethers.ZeroAddress,
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

        const tokenAddress = await getTREXSuiteDeployedTokenAddress(tx);

        await expect(trexFactory.connect(aliceWallet).recoverContractOwnership(tokenAddress, aliceWallet.address)).to.be.revertedWithCustomError(
          trexFactory,
          'OwnableUnauthorizedAccount',
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
            owner: trexFactory.target,
            name: 'Token name',
            symbol: 'SYM',
            decimals: 8,
            irs: ethers.ZeroAddress,
            ONCHAINID: ethers.ZeroAddress,
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

        const tokenAddress = await getTREXSuiteDeployedTokenAddress(deployTx);
        const token = await ethers.getContractAt('Token', tokenAddress);

        const tx = await trexFactory.connect(deployer).recoverContractOwnership(tokenAddress, aliceWallet.address);
        expect(tx).to.emit(token, 'OwnershipTransferStarted').withArgs(trexFactory.target, aliceWallet.address);
        const tx2 = await token.connect(aliceWallet).acceptOwnership();
        expect(tx2).to.emit(token, 'OwnershipTransferStarted').withArgs(trexFactory.target, aliceWallet.address);

        expect(await token.owner()).to.eq(aliceWallet.address);
      });
    });
  });
});
