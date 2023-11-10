import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployFullSuiteFixture } from './fixtures/deploy-full-suite.fixture';

describe('TREXGateway', () => {
  describe('.setFactory()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(gateway.connect(context.accounts.anotherWallet).setFactory(context.factories.trexFactory.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });
    describe('when called by owner', () => {
      describe('if called with zero address', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.setFactory(ethers.constants.AddressZero)).to.be.revertedWithCustomError(gateway, 'ZeroAddress');
        });
      });
      describe('if called with valid address', () => {
        it('should set Factory', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);
          expect(await gateway.getFactory()).to.equal(ethers.constants.AddressZero);

          const tx = await gateway.setFactory(context.factories.trexFactory.address);
          expect(tx).to.emit(gateway, 'FactorySet');
          expect(await gateway.getFactory()).to.equal(context.factories.trexFactory.address);
        });
      });
    });
  });
  describe('.setPublicDeploymentStatus()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(gateway.connect(context.accounts.anotherWallet).setPublicDeploymentStatus(true)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });
    describe('when called by owner', () => {
      describe('if doesnt change status', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.setPublicDeploymentStatus(false)).to.be.revertedWithCustomError(gateway, 'PublicDeploymentAlreadyDisabled');
          await gateway.setPublicDeploymentStatus(true);
          await expect(gateway.setPublicDeploymentStatus(true)).to.be.revertedWithCustomError(gateway, 'PublicDeploymentAlreadyEnabled');
        });
      });
      describe('if changes status', () => {
        it('should set new status', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          expect(await gateway.getPublicDeploymentStatus()).to.equal(false);
          const tx = await gateway.setPublicDeploymentStatus(true);
          expect(tx).to.emit(gateway, 'PublicDeploymentStatusSet');
          expect(await gateway.getPublicDeploymentStatus()).to.equal(true);
        });
      });
    });
  });
  describe('.transferFactoryOwnership()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).transferFactoryOwnership(context.accounts.anotherWallet.address),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
    describe('when called by owner', () => {
      it('should transfer factory ownership', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        const tx = await gateway.transferFactoryOwnership(context.accounts.deployer.address);
        expect(tx).to.emit(context.factories.trexFactory, 'OwnershipTransferred');
      });
    });
  });
  describe('.enableDeploymentFee()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(gateway.connect(context.accounts.anotherWallet).enableDeploymentFee(true)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        );
      });
    });
    describe('when called by owner', () => {
      describe('if doesnt change status', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.enableDeploymentFee(false)).to.be.revertedWithCustomError(gateway, 'DeploymentFeesAlreadyDisabled');
          await gateway.enableDeploymentFee(true);
          await expect(gateway.enableDeploymentFee(true)).to.be.revertedWithCustomError(gateway, 'DeploymentFeesAlreadyEnabled');
        });
      });
      describe('if changes status', () => {
        it('should set new status', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          expect(await gateway.isDeploymentFeeEnabled()).to.equal(false);
          const tx = await gateway.enableDeploymentFee(true);
          expect(tx).to.emit(gateway, 'DeploymentFeeEnabled');
          expect(await gateway.isDeploymentFeeEnabled()).to.equal(true);
        });
      });
    });
  });
  describe('.setDeploymentFee()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).setDeploymentFee(100, context.suite.token.address, context.accounts.anotherWallet.address),
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
    describe('when called by owner', () => {
      describe('if required parameters are not filled', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.setDeploymentFee(100, ethers.constants.AddressZero, context.accounts.deployer.address)).to.be.revertedWithCustomError(
            gateway,
            'ZeroAddress',
          );
          await expect(gateway.setDeploymentFee(100, context.suite.token.address, ethers.constants.AddressZero)).to.be.revertedWithCustomError(
            gateway,
            'ZeroAddress',
          );
        });
      });
      describe('if called properly', () => {
        it('should set new fees structure', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          const tx = await gateway.setDeploymentFee(100, context.suite.token.address, context.accounts.deployer.address);
          expect(tx).to.emit(gateway, 'DeploymentFeeSet');
          const feeStructure = await gateway.getDeploymentFee();
          expect(feeStructure.fee).to.equal(100);
          expect(feeStructure.feeToken).to.equal(context.suite.token.address);
          expect(feeStructure.feeCollector).to.equal(context.accounts.deployer.address);
        });
      });
    });
  });
  describe('.addDeployer()', () => {
    describe('when called by not admin', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).addDeployer(context.accounts.anotherWallet.address),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('if deployer already exists', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addDeployer(context.accounts.tokenAgent.address);
          await expect(gateway.addDeployer(context.accounts.tokenAgent.address)).to.be.revertedWithCustomError(gateway, 'DeployerAlreadyExists');
        });
      });
      describe('if new deployer', () => {
        it('should add new deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
          const tx = await gateway.addDeployer(context.accounts.tokenAgent.address);
          expect(tx).to.emit(gateway, 'DeployerAdded');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
        });
      });
    });
    describe('when called by agent', () => {
      describe('if deployer already exists', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addAgent(context.accounts.tokenAgent.address);
          await gateway.addDeployer(context.accounts.tokenAgent.address);
          await expect(gateway.connect(context.accounts.tokenAgent).addDeployer(context.accounts.tokenAgent.address)).to.be.revertedWithCustomError(
            gateway,
            'DeployerAlreadyExists',
          );
        });
      });
      describe('if new deployer', () => {
        it('should add new deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
          await gateway.addAgent(context.accounts.tokenAgent.address);
          const tx = await gateway.connect(context.accounts.tokenAgent).addDeployer(context.accounts.tokenAgent.address);
          expect(tx).to.emit(gateway, 'DeployerAdded');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
        });
      });
    });
  });
  describe('.batchAddDeployer()', () => {
    describe('when called by not admin', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).batchAddDeployer([context.accounts.anotherWallet.address]),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('when adding a batch of deployers that includes an already registered deployer', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addDeployer(context.accounts.tokenAgent.address);
          const newDeployers = Array.from({ length: 9 }, () => ethers.Wallet.createRandom().address);
          const randomIndex = Math.floor(Math.random() * newDeployers.length);
          newDeployers.splice(randomIndex, 0, context.accounts.tokenAgent.address);
          await expect(gateway.batchAddDeployer(newDeployers)).to.be.revertedWithCustomError(gateway, 'DeployerAlreadyExists');
        });
      });
      describe('when adding a batch of more than 500 deployers', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          const duplicateAddress = ethers.Wallet.createRandom().address;
          const newDeployers = Array.from({ length: 501 }, () => duplicateAddress);
          await expect(gateway.batchAddDeployer(newDeployers)).to.be.revertedWithCustomError(gateway, 'BatchMaxLengthExceeded');
        });
      });
      describe('if new deployers', () => {
        it('should add 1 new deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
          const tx = await gateway.batchAddDeployer([context.accounts.tokenAgent.address]);
          expect(tx).to.emit(gateway, 'DeployerAdded');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
        });
        it('should add 10 new deployers', async () => {
          const context = await loadFixture(deployFullSuiteFixture);
          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);
          const newDeployers = Array.from({ length: 10 }, () => ethers.Wallet.createRandom().address);
          for (let i = 0; i < newDeployers.length; i += 1) {
            expect(await gateway.isDeployer(newDeployers[i])).to.equal(false);
          }
          const tx = await gateway.batchAddDeployer(newDeployers);
          for (let i = 0; i < newDeployers.length; i += 1) {
            await expect(tx).to.emit(gateway, 'DeployerAdded').withArgs(newDeployers[i]);
          }
          for (let i = 0; i < newDeployers.length; i += 1) {
            expect(await gateway.isDeployer(newDeployers[i])).to.equal(true);
          }
        });
      });
    });
    describe('when called by agent', () => {
      describe('when adding a batch of deployers that includes an already registered deployer', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addAgent(context.accounts.anotherWallet.address);
          await gateway.connect(context.accounts.anotherWallet).addDeployer(context.accounts.tokenAgent.address);
          const newDeployers = Array.from({ length: 9 }, () => ethers.Wallet.createRandom().address);
          const randomIndex = Math.floor(Math.random() * newDeployers.length);
          newDeployers.splice(randomIndex, 0, context.accounts.tokenAgent.address);
          await expect(gateway.connect(context.accounts.anotherWallet).batchAddDeployer(newDeployers)).to.be.revertedWithCustomError(
            gateway,
            'DeployerAlreadyExists',
          );
        });
      });
      describe('if new deployers', () => {
        it('should add 1 new deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addAgent(context.accounts.anotherWallet.address);
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
          const tx = await gateway.connect(context.accounts.anotherWallet).batchAddDeployer([context.accounts.tokenAgent.address]);
          expect(tx).to.emit(gateway, 'DeployerAdded');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
        });
        it('should add 10 new deployers', async () => {
          const context = await loadFixture(deployFullSuiteFixture);
          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);
          const newDeployers = Array.from({ length: 10 }, () => ethers.Wallet.createRandom().address);
          for (let i = 0; i < newDeployers.length; i += 1) {
            expect(await gateway.isDeployer(newDeployers[i])).to.equal(false);
          }
          await gateway.addAgent(context.accounts.anotherWallet.address);
          const tx = await gateway.connect(context.accounts.anotherWallet).batchAddDeployer(newDeployers);
          for (let i = 0; i < newDeployers.length; i += 1) {
            await expect(tx).to.emit(gateway, 'DeployerAdded').withArgs(newDeployers[i]);
          }
          for (let i = 0; i < newDeployers.length; i += 1) {
            expect(await gateway.isDeployer(newDeployers[i])).to.equal(true);
          }
        });
      });
    });
  });
  describe('.removeDeployer()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).removeDeployer(context.accounts.anotherWallet.address),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('if deployer does not exist', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.removeDeployer(context.accounts.tokenAgent.address)).to.be.revertedWithCustomError(gateway, 'DeployerDoesNotExist');
        });
      });
      describe('if deployer exists', () => {
        it('should remove deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addDeployer(context.accounts.tokenAgent.address);
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
          const tx = await gateway.removeDeployer(context.accounts.tokenAgent.address);
          expect(tx).to.emit(gateway, 'DeployerRemoved');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
        });
      });
    });
  });
  describe('.batchRemoveDeployer()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).batchRemoveDeployer([context.accounts.anotherWallet.address]),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('if deployer does not exist', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.batchRemoveDeployer([context.accounts.tokenAgent.address])).to.be.revertedWithCustomError(
            gateway,
            'DeployerDoesNotExist',
          );
        });
      });
      describe('if deployer exists', () => {
        it('should remove deployer', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addDeployer(context.accounts.tokenAgent.address);
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(true);
          const tx = await gateway.batchRemoveDeployer([context.accounts.tokenAgent.address]);
          expect(tx).to.emit(gateway, 'DeployerRemoved');
          expect(await gateway.isDeployer(context.accounts.tokenAgent.address)).to.equal(false);
        });
        describe('when called by an agent', () => {
          describe('if at least one deployer does not exist', () => {
            it('should revert', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);

              const deployers = Array.from({ length: 9 }, () => ethers.Wallet.createRandom().address);
              await gateway.batchAddDeployer(deployers);
              deployers.push(context.accounts.tokenAgent.address);
              await gateway.addAgent(context.accounts.tokenAgent.address);
              await expect(gateway.connect(context.accounts.tokenAgent).batchRemoveDeployer(deployers)).to.be.revertedWithCustomError(
                gateway,
                'DeployerDoesNotExist',
              );
            });
          });
          describe('if trying to remove more than 500 deployers', () => {
            it('should revert', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);

              const duplicateAddress = ethers.Wallet.createRandom().address;
              const deployers = Array.from({ length: 501 }, () => duplicateAddress);
              await gateway.addAgent(context.accounts.tokenAgent.address);
              await expect(gateway.connect(context.accounts.tokenAgent).batchRemoveDeployer(deployers)).to.be.revertedWithCustomError(
                gateway,
                'BatchMaxLengthExceeded',
              );
            });
          });
          describe('if all deployers exist', () => {
            it('should remove deployers', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);

              const deployers = Array.from({ length: 10 }, () => ethers.Wallet.createRandom().address);
              await gateway.batchAddDeployer(deployers);
              await gateway.addAgent(context.accounts.tokenAgent.address);

              const tx = await gateway.connect(context.accounts.tokenAgent).batchRemoveDeployer(deployers);
              for (let i = 0; i < deployers.length; i += 1) {
                await expect(tx).to.emit(gateway, 'DeployerRemoved');
                expect(await gateway.isDeployer(deployers[i])).to.equal(false);
              }
            });
          });
        });
      });
    });
  });
  describe('.applyFeeDiscount()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).applyFeeDiscount(context.accounts.anotherWallet.address, 5000),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('if discount out of range', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.applyFeeDiscount(context.accounts.anotherWallet.address, 12000)).to.be.revertedWithCustomError(
            gateway,
            'DiscountOutOfRange',
          );
        });
      });
      describe('if discount valid', () => {
        it('should apply discount', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.setDeploymentFee(20000, context.suite.token.address, context.accounts.deployer.address);
          expect(await gateway.calculateFee(context.accounts.bobWallet.address)).to.equal(20000);
          const tx = await gateway.applyFeeDiscount(context.accounts.bobWallet.address, 5000);
          expect(tx).to.emit(gateway, 'FeeDiscountApplied');
          expect(await gateway.calculateFee(context.accounts.bobWallet.address)).to.equal(10000);
        });
      });
    });
  });
  describe('.batchApplyFeeDiscount()', () => {
    describe('when called by not owner', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployFullSuiteFixture);

        const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
        await context.factories.trexFactory.transferOwnership(gateway.address);

        await expect(
          gateway.connect(context.accounts.anotherWallet).batchApplyFeeDiscount([context.accounts.anotherWallet.address], [5000]),
        ).to.be.revertedWithCustomError(gateway, 'OnlyAdminCall');
      });
    });
    describe('when called by owner', () => {
      describe('if discount out of range', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(gateway.batchApplyFeeDiscount([context.accounts.anotherWallet.address], [12000])).to.be.revertedWithCustomError(
            gateway,
            'DiscountOutOfRange',
          );
        });
      });
      describe('if batch more than 500 entries', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          const duplicateAddress = ethers.Wallet.createRandom().address;
          const deployers = Array.from({ length: 501 }, () => duplicateAddress);
          const discounts = Array.from({ length: 501 }, () => 5000);

          await expect(gateway.batchApplyFeeDiscount(deployers, discounts)).to.be.revertedWithCustomError(gateway, 'BatchMaxLengthExceeded');
        });
      });
      describe('if discount valid', () => {
        it('should apply discount', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.setDeploymentFee(20000, context.suite.token.address, context.accounts.deployer.address);
          expect(await gateway.calculateFee(context.accounts.bobWallet.address)).to.equal(20000);
          const tx = await gateway.batchApplyFeeDiscount([context.accounts.bobWallet.address], [5000]);
          expect(tx).to.emit(gateway, 'FeeDiscountApplied');
          expect(await gateway.calculateFee(context.accounts.bobWallet.address)).to.equal(10000);
        });
      });
    });
    describe('when called by agent', () => {
      describe('if any discount in the batch is out of range', () => {
        it('should revert the whole batch', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);
          const deployers = Array.from({ length: 10 }, () => ethers.Wallet.createRandom().address);
          const discounts = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10000));
          discounts.push(12000);

          await gateway.addAgent(context.accounts.tokenAgent.address);
          await expect(gateway.connect(context.accounts.tokenAgent).batchApplyFeeDiscount(deployers, discounts)).to.be.revertedWithCustomError(
            gateway,
            'DiscountOutOfRange',
          );
        });
      });
      describe('if all discounts are valid', () => {
        it('should apply discounts to all deployers', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [ethers.constants.AddressZero, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          const deploymentFee = 20000;
          await gateway.setDeploymentFee(deploymentFee, context.suite.token.address, context.accounts.deployer.address);

          const deployers = Array.from({ length: 10 }, () => ethers.Wallet.createRandom().address);
          const discounts = Array.from({ length: 10 }, () => 5000);

          await gateway.addAgent(context.accounts.tokenAgent.address);
          const tx = await gateway.connect(context.accounts.tokenAgent).batchApplyFeeDiscount(deployers, discounts);

          for (let i = 0; i < deployers.length; i += 1) {
            await expect(tx).to.emit(gateway, 'FeeDiscountApplied').withArgs(deployers[i], discounts[i]);
          }

          for (let i = 0; i < deployers.length; i += 1) {
            const expectedFeeAfterDiscount = deploymentFee - (deploymentFee * discounts[0]) / 10000;
            expect(await gateway.calculateFee(deployers[i])).to.equal(expectedFeeAfterDiscount);
          }
        });
      });
    });
  });
  describe('.deployTREXSuite()', () => {
    describe('when called by not deployer', () => {
      describe('when public deployments disabled', () => {
        it('should revert', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await expect(
            gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
              {
                owner: context.accounts.anotherWallet.address,
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
          ).to.be.revertedWithCustomError(gateway, 'PublicDeploymentsNotAllowed');
        });
      });
      describe('when public deployments are enabled', () => {
        describe('when try to deploy on behalf', () => {
          it('should revert', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);

            await expect(
              gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
                {
                  owner: context.accounts.bobWallet.address,
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
            ).to.be.revertedWithCustomError(gateway, 'PublicCannotDeployOnBehalf');
          });
        });
        describe('when deployment fees are not activated', () => {
          it('should deploy a token for free', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);

            const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
              {
                owner: context.accounts.anotherWallet.address,
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
            expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
            expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
          });
        });
        describe('when deployment fees are activated', () => {
          describe('when caller has no discount', () => {
            it('should deploy a token for full fee', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);
              const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
              await feeToken.mint(context.accounts.anotherWallet.address, 100000);
              await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
              await gateway.enableDeploymentFee(true);

              await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 20000);
              const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
                {
                  owner: context.accounts.anotherWallet.address,
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
              expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
              expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
              expect(tx).to.emit(feeToken, 'Transfer');
              expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(80000);
            });
          });
          describe('when caller has 50% discount', () => {
            it('should deploy a token for half fee', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);
              const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
              await feeToken.mint(context.accounts.anotherWallet.address, 100000);
              await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
              await gateway.enableDeploymentFee(true);
              await gateway.applyFeeDiscount(context.accounts.anotherWallet.address, 5000);

              await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 20000);
              const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
                {
                  owner: context.accounts.anotherWallet.address,
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
              expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
              expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
              expect(tx).to.emit(feeToken, 'Transfer');
              expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(90000);
            });
          });
        });
      });
    });
    describe('when called by deployer', () => {
      describe('when public deployments disabled', () => {
        it('should deploy', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);
          await gateway.addDeployer(context.accounts.anotherWallet.address);

          const tx = gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
            {
              owner: context.accounts.anotherWallet.address,
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
          expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
          expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
        });
      });
      describe('when try to deploy on behalf', () => {
        it('should deploy', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          await gateway.addDeployer(context.accounts.anotherWallet.address);

          const tx = gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
            {
              owner: context.accounts.bobWallet.address,
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
          expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
          expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
        });
      });
      describe('when deployment fees are activated', () => {
        describe('when caller has no discount', () => {
          it('should deploy a token for full fee', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);
            await gateway.addDeployer(context.accounts.anotherWallet.address);
            const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
            await feeToken.mint(context.accounts.anotherWallet.address, 100000);
            await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
            await gateway.enableDeploymentFee(true);

            await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 20000);
            const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
              {
                owner: context.accounts.anotherWallet.address,
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
            expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
            expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            expect(tx).to.emit(feeToken, 'Transfer');
            expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(80000);
          });
        });
        describe('when caller has 50% discount', () => {
          it('should deploy a token for half fee', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);
            await gateway.addDeployer(context.accounts.anotherWallet.address);
            const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
            await feeToken.mint(context.accounts.anotherWallet.address, 100000);
            await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
            await gateway.enableDeploymentFee(true);
            await gateway.applyFeeDiscount(context.accounts.anotherWallet.address, 5000);

            await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 20000);
            const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
              {
                owner: context.accounts.anotherWallet.address,
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
            expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
            expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            expect(tx).to.emit(feeToken, 'Transfer');
            expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(90000);
          });
        });
        describe('when caller has 100% discount', () => {
          it('should deploy a token for free', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);
            await gateway.addDeployer(context.accounts.anotherWallet.address);
            const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
            await feeToken.mint(context.accounts.anotherWallet.address, 100000);
            await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
            await gateway.enableDeploymentFee(true);
            await gateway.applyFeeDiscount(context.accounts.anotherWallet.address, 10000);

            await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 20000);
            const tx = await gateway.connect(context.accounts.anotherWallet).deployTREXSuite(
              {
                owner: context.accounts.anotherWallet.address,
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
            expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
            expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            expect(tx).to.emit(feeToken, 'Transfer');
            expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(100000);
          });
        });
      });
    });
  });
  describe('.batchDeployTREXSuite()', () => {
    describe('when called by not deployer', () => {
      describe('when public deployments disabled', () => {
        it('should revert for batch deployment', async () => {
          const context = await loadFixture(deployFullSuiteFixture);

          const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
          await context.factories.trexFactory.transferOwnership(gateway.address);

          const tokenDetailsArray = [];
          const claimDetailsArray = [];
          for (let i = 0; i < 5; i += 1) {
            tokenDetailsArray.push({
              owner: context.accounts.anotherWallet.address,
              name: `Token name ${i}`,
              symbol: `SYM${i}`,
              decimals: 8,
              irs: ethers.constants.AddressZero,
              ONCHAINID: ethers.constants.AddressZero,
              irAgents: [],
              tokenAgents: [],
              complianceModules: [],
              complianceSettings: [],
            });
            claimDetailsArray.push({
              claimTopics: [],
              issuers: [],
              issuerClaims: [],
            });
          }

          await expect(
            gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray),
          ).to.be.revertedWithCustomError(gateway, 'PublicDeploymentsNotAllowed');
        });
      });
      describe('when public deployments are enabled', () => {
        describe('when try to deploy on behalf in a batch', () => {
          it('should revert the whole batch', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);

            const tokenDetailsArray = [];
            const claimDetailsArray = [];
            for (let i = 0; i < 4; i += 1) {
              tokenDetailsArray.push({
                owner: context.accounts.anotherWallet.address,
                name: `Token name ${i}`,
                symbol: `SYM${i}`,
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              });
              claimDetailsArray.push({
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              });
            }
            tokenDetailsArray.push({
              owner: context.accounts.bobWallet.address,
              name: 'Token name behalf',
              symbol: 'SYM42',
              decimals: 8,
              irs: ethers.constants.AddressZero,
              ONCHAINID: ethers.constants.AddressZero,
              irAgents: [],
              tokenAgents: [],
              complianceModules: [],
              complianceSettings: [],
            });
            claimDetailsArray.push({
              claimTopics: [],
              issuers: [],
              issuerClaims: [],
            });

            await expect(
              gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray),
            ).to.be.revertedWithCustomError(gateway, 'PublicCannotDeployOnBehalf');
          });
        });
        describe('when try to deploy a batch of more than 5 tokens', () => {
          it('should revert the batch', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);

            const tokenDetailsArray = [];
            const claimDetailsArray = [];
            for (let i = 0; i < 6; i += 1) {
              tokenDetailsArray.push({
                owner: context.accounts.anotherWallet.address,
                name: `Token name ${i}`,
                symbol: `SYM${i}`,
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              });
              claimDetailsArray.push({
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              });
            }

            await expect(
              gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray),
            ).to.be.revertedWithCustomError(gateway, 'BatchMaxLengthExceeded');
          });
        });
        describe('when deployment fees are not activated', () => {
          it('should deploy tokens for free in a batch', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);

            const tokenDetailsArray = [];
            const claimDetailsArray = [];
            for (let i = 0; i < 5; i += 1) {
              tokenDetailsArray.push({
                owner: context.accounts.anotherWallet.address,
                name: `Token name ${i}`,
                symbol: `SYM${i}`,
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              });
              claimDetailsArray.push({
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              });
            }

            const tx = await gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray);

            for (let i = 0; i < tokenDetailsArray.length; i += 1) {
              await expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
              await expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            }
          });
        });
        describe('when deployment fees are activated', () => {
          describe('when caller has no discount', () => {
            it('should deploy tokens for full fee in a batch', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);
              const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
              await feeToken.mint(context.accounts.anotherWallet.address, 500000);
              await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
              await gateway.enableDeploymentFee(true);

              await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 100000);

              const tokenDetailsArray = [];
              const claimDetailsArray = [];
              for (let i = 0; i < 5; i += 1) {
                tokenDetailsArray.push({
                  owner: context.accounts.anotherWallet.address,
                  name: `Token name ${i}`,
                  symbol: `SYM${i}`,
                  decimals: 8,
                  irs: ethers.constants.AddressZero,
                  ONCHAINID: ethers.constants.AddressZero,
                  irAgents: [],
                  tokenAgents: [],
                  complianceModules: [],
                  complianceSettings: [],
                });
                claimDetailsArray.push({
                  claimTopics: [],
                  issuers: [],
                  issuerClaims: [],
                });
              }

              const tx = await gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray);

              for (let i = 0; i < tokenDetailsArray.length; i += 1) {
                expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
                expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
                expect(tx).to.emit(feeToken, 'Transfer').withArgs(context.accounts.anotherWallet.address, context.accounts.deployer.address, 20000);
              }
              expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(400000);
            });
          });
          describe('when caller has 50% discount', () => {
            it('should deploy tokens for half fee in a batch', async () => {
              const context = await loadFixture(deployFullSuiteFixture);

              const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, true], context.accounts.deployer);
              await context.factories.trexFactory.transferOwnership(gateway.address);
              const feeToken = await ethers.deployContract('TestERC20', ['FeeToken', 'FT']);
              await feeToken.mint(context.accounts.anotherWallet.address, 500000);
              await gateway.setDeploymentFee(20000, feeToken.address, context.accounts.deployer.address);
              await gateway.enableDeploymentFee(true);
              await gateway.applyFeeDiscount(context.accounts.anotherWallet.address, 5000);
              await feeToken.connect(context.accounts.anotherWallet).approve(gateway.address, 50000);

              const tokenDetailsArray = [];
              const claimDetailsArray = [];
              for (let i = 0; i < 5; i += 1) {
                tokenDetailsArray.push({
                  owner: context.accounts.anotherWallet.address,
                  name: `Token name ${i}`,
                  symbol: `SYM${i}`,
                  decimals: 8,
                  irs: ethers.constants.AddressZero,
                  ONCHAINID: ethers.constants.AddressZero,
                  irAgents: [],
                  tokenAgents: [],
                  complianceModules: [],
                  complianceSettings: [],
                });
                claimDetailsArray.push({
                  claimTopics: [],
                  issuers: [],
                  issuerClaims: [],
                });
              }

              const tx = await gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray);

              for (let i = 0; i < tokenDetailsArray.length; i += 1) {
                expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
                expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
                expect(tx).to.emit(feeToken, 'Transfer').withArgs(context.accounts.anotherWallet.address, context.accounts.deployer.address, 10000);
              }
              expect(await feeToken.balanceOf(context.accounts.anotherWallet.address)).to.equal(450000);
            });
          });
        });
      });
      describe('when called by deployer', () => {
        describe('when public deployments disabled', () => {
          it('should deploy in batch', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);
            await gateway.addDeployer(context.accounts.anotherWallet.address);

            const tokenDetailsArray = [];
            const claimDetailsArray = [];
            for (let i = 0; i < 5; i += 1) {
              tokenDetailsArray.push({
                owner: context.accounts.anotherWallet.address,
                name: `Token name ${i}`,
                symbol: `SYM${i}`,
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              });
              claimDetailsArray.push({
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              });
            }

            const tx = await gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray);

            for (let i = 0; i < tokenDetailsArray.length; i += 1) {
              await expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
              await expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            }
          });
        });
        describe('when trying to deploy on behalf', () => {
          it('should deploy in batch', async () => {
            const context = await loadFixture(deployFullSuiteFixture);

            const gateway = await ethers.deployContract('TREXGateway', [context.factories.trexFactory.address, false], context.accounts.deployer);
            await context.factories.trexFactory.transferOwnership(gateway.address);
            await gateway.addDeployer(context.accounts.anotherWallet.address);

            const tokenDetailsArray = [];
            const claimDetailsArray = [];
            for (let i = 0; i < 5; i += 1) {
              tokenDetailsArray.push({
                owner: context.accounts.bobWallet.address,
                name: `Token name ${i}`,
                symbol: `SYM${i}`,
                decimals: 8,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [],
                tokenAgents: [],
                complianceModules: [],
                complianceSettings: [],
              });
              claimDetailsArray.push({
                claimTopics: [],
                issuers: [],
                issuerClaims: [],
              });
            }

            const tx = await gateway.connect(context.accounts.anotherWallet).batchDeployTREXSuite(tokenDetailsArray, claimDetailsArray);

            for (let i = 0; i < tokenDetailsArray.length; i += 1) {
              await expect(tx).to.emit(gateway, 'GatewaySuiteDeploymentProcessed');
              await expect(tx).to.emit(context.factories.trexFactory, 'TREXSuiteDeployed');
            }
          });
        });
      });
    });
  });
});
