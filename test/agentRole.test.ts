import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

async function deployAgentFixture() {
  const [ownerWallet, aliceWallet, bobWallet] = await ethers.getSigners();

  const agentRole = await ethers.deployContract('AgentRole');

  return {
    accounts: {
      ownerWallet,
      aliceWallet,
      bobWallet,
    },
    contracts: {
      agentRole,
    },
  };
}

describe('AgentRole', () => {
  describe('.addAgent', () => {
    describe('when the sender is not the owner', () => {
      it('should reverts', async () => {
        const {
          accounts: { aliceWallet, bobWallet },
          contracts: { agentRole },
        } = await loadFixture(deployAgentFixture);

        await expect(agentRole.connect(bobWallet).addAgent(aliceWallet.address)).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when the sender is the owner', () => {
      describe('when address to add is the zero address', () => {
        it('should reverts', async () => {
          const {
            accounts: { ownerWallet },
            contracts: { agentRole },
          } = await loadFixture(deployAgentFixture);

          await expect(agentRole.connect(ownerWallet).addAgent(ethers.constants.AddressZero)).to.be.revertedWith('invalid argument - zero address');
        });
      });

      describe('when address to add is a valid address', () => {
        describe('when address to add is already an agent', () => {
          it('should reverts', async () => {
            const {
              accounts: { ownerWallet, aliceWallet },
              contracts: { agentRole },
            } = await loadFixture(deployAgentFixture);

            await agentRole.connect(ownerWallet).addAgent(aliceWallet.address);
            await expect(agentRole.connect(ownerWallet).addAgent(aliceWallet.address)).to.be.revertedWith('Roles: account already has role');
          });
        });

        describe('when address to add is not an agent address', () => {
          it('should add the agent', async () => {
            const {
              accounts: { ownerWallet, aliceWallet },
              contracts: { agentRole },
            } = await loadFixture(deployAgentFixture);

            const tx = await agentRole.connect(ownerWallet).addAgent(aliceWallet.address);
            await expect(tx).to.emit(agentRole, 'AgentAdded').withArgs(aliceWallet.address);
            expect(await agentRole.isAgent(aliceWallet.address)).to.be.true;
          });
        });
      });
    });
  });

  describe('.removeAgent', () => {
    describe('when the sender is not the owner', () => {
      it('should reverts', async () => {
        const {
          accounts: { aliceWallet, bobWallet },
          contracts: { agentRole },
        } = await loadFixture(deployAgentFixture);

        await expect(agentRole.connect(bobWallet).removeAgent(aliceWallet.address)).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });

    describe('when the sender is the owner', () => {
      describe('when address to add is the zero address', () => {
        it('should reverts', async () => {
          const {
            accounts: { ownerWallet },
            contracts: { agentRole },
          } = await loadFixture(deployAgentFixture);

          await expect(agentRole.connect(ownerWallet).removeAgent(ethers.constants.AddressZero)).to.be.revertedWith(
            'invalid argument - zero address',
          );
        });
      });

      describe('when address to add is a valid address', () => {
        describe('when address to add is not an agent', () => {
          it('should reverts', async () => {
            const {
              accounts: { ownerWallet, aliceWallet },
              contracts: { agentRole },
            } = await loadFixture(deployAgentFixture);

            await expect(agentRole.connect(ownerWallet).removeAgent(aliceWallet.address)).to.be.revertedWith('Roles: account does not have role');
          });
        });

        describe('when address to add is an agent address', () => {
          it('should remove the agent', async () => {
            const {
              accounts: { ownerWallet, aliceWallet },
              contracts: { agentRole },
            } = await loadFixture(deployAgentFixture);

            await agentRole.connect(ownerWallet).addAgent(aliceWallet.address);
            const tx = await agentRole.connect(ownerWallet).removeAgent(aliceWallet.address);
            await expect(tx).to.emit(agentRole, 'AgentRemoved').withArgs(aliceWallet.address);
            expect(await agentRole.isAgent(aliceWallet.address)).to.be.false;
          });
        });
      });
    });
  });
});
