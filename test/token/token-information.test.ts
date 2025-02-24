import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployFullSuiteFixture, deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

describe('Token - Information', () => {
  describe('.setName()', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setName('My Token')).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');
      });
    });

    describe('when the caller is the owner', () => {
      describe('when the name is empty', () => {
        it('should revert', async () => {
          const {
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(token.setName('')).to.be.revertedWithCustomError(token, 'EmptyString');
        });
      });

      it('should set the name', async () => {
        const {
          suite: { token },
        } = await loadFixture(deployFullSuiteFixture);
        const tx = await token.setName('Updated Test Token');
        await expect(tx)
          .to.emit(token, 'UpdatedTokenInformation')
          .withArgs('Updated Test Token', await token.symbol(), await token.decimals(), await token.version(), await token.onchainID());
        expect(await token.name()).to.equal('Updated Test Token');
      });
    });
  });

  describe('.setSymbol()', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setSymbol('UpdtTK')).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');
      });
    });

    describe('when the caller is the owner', () => {
      describe('when the symbol is empty', () => {
        it('should revert', async () => {
          const {
            suite: { token },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(token.setSymbol('')).to.be.revertedWithCustomError(token, 'EmptyString');
        });
      });

      it('should set the symbol', async () => {
        const {
          suite: { token },
        } = await loadFixture(deployFullSuiteFixture);
        const tx = await token.setSymbol('UpdtTK');
        await expect(tx)
          .to.emit(token, 'UpdatedTokenInformation')
          .withArgs(await token.name(), 'UpdtTK', await token.decimals(), await token.version(), await token.onchainID());
        expect(await token.symbol()).to.equal('UpdtTK');
      });
    });
  });

  describe('.setOnchainID()', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setOnchainID(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          token,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('when the caller is the owner', () => {
      it('should set the onchainID', async () => {
        const {
          suite: { token },
        } = await loadFixture(deployFullSuiteFixture);
        const tx = await token.setOnchainID(ethers.ZeroAddress);
        await expect(tx)
          .to.emit(token, 'UpdatedTokenInformation')
          .withArgs(await token.name(), await token.symbol(), await token.decimals(), await token.version(), ethers.ZeroAddress);
        expect(await token.onchainID()).to.equal(ethers.ZeroAddress);
      });
    });
  });

  describe('.setIdentityRegistry()', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setIdentityRegistry(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          token,
          'OwnableUnauthorizedAccount',
        );
      });
    });
  });

  describe('.totalSupply()', () => {
    it('should return the total supply', async () => {
      const {
        suite: { token },
        accounts: { aliceWallet, bobWallet },
      } = await loadFixture(deployFullSuiteFixture);

      const balance = await token.balanceOf(aliceWallet.address).then(async (b) => b + (await token.balanceOf(bobWallet.address)));
      expect(await token.totalSupply()).to.equal(balance);
    });
  });

  describe('.setCompliance', () => {
    describe('when the caller is not the owner', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setCompliance(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          token,
          'OwnableUnauthorizedAccount',
        );
      });
    });
  });

  describe('.compliance()', () => {
    it('should return the compliance address', async () => {
      const {
        suite: { token, compliance },
      } = await loadFixture(deploySuiteWithModularCompliancesFixture);
      await token.setCompliance(compliance.target);
      expect(await token.compliance()).to.equal(compliance.target);
    });
  });

  describe('.pause()', () => {
    describe('when the caller is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).pause()).to.be.revertedWithCustomError(token, 'CallerDoesNotHaveAgentRole');
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: false,
          disablePause: true,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).pause()).to.be.revertedWithCustomError(token, 'AgentNotAuthorized');
      });
    });

    describe('when the caller is an agent', () => {
      describe('when the token is not paused', () => {
        it('should pause the token', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);
          const tx = await token.connect(tokenAgent).pause();
          await expect(tx).to.emit(token, 'Paused').withArgs(tokenAgent.address);
          expect(await token.paused()).to.be.true;
        });
      });

      describe('when the token is paused', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);
          await token.connect(tokenAgent).pause();
          await expect(token.connect(tokenAgent).pause()).to.be.revertedWithCustomError(token, 'EnforcedPause');
        });
      });
    });
  });

  describe('.unpause()', () => {
    describe('when the caller is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).unpause()).to.be.revertedWithCustomError(token, 'CallerDoesNotHaveAgentRole');
      });
    });

    describe('when agent permission is restricted', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { tokenAgent },
        } = await loadFixture(deployFullSuiteFixture);
        await token.connect(tokenAgent).pause();

        await token.setAgentRestrictions(tokenAgent.address, {
          disableAddressFreeze: false,
          disableBurn: false,
          disableForceTransfer: false,
          disableMint: false,
          disablePartialFreeze: false,
          disablePause: true,
          disableRecovery: false,
        });

        await expect(token.connect(tokenAgent).unpause()).to.be.revertedWithCustomError(token, 'AgentNotAuthorized');
      });
    });

    describe('when the caller is an agent', () => {
      describe('when the token is paused', () => {
        it('should unpause the token', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);
          await token.connect(tokenAgent).pause();
          const tx = await token.connect(tokenAgent).unpause();
          await expect(tx).to.emit(token, 'Unpaused').withArgs(tokenAgent.address);
          expect(await token.paused()).to.be.false;
        });
      });

      describe('when the token is not paused', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(token.connect(tokenAgent).unpause()).to.be.revertedWithCustomError(token, 'ExpectedPause');
        });
      });
    });
  });

  describe('.setAddressFrozen', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).setAddressFrozen(anotherWallet.address, true)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });
  });

  describe('.freezePartialTokens', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).freezePartialTokens(anotherWallet.address, 1)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });

    describe('when sender is an agent', () => {
      describe('when amounts exceed current balance', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, anotherWallet },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(token.connect(tokenAgent).freezePartialTokens(anotherWallet.address, 1)).to.be.revertedWithCustomError(
            token,
            'ERC20InsufficientBalance',
          );
        });
      });
    });
  });

  describe('.unfreezePartialTokens', () => {
    describe('when sender is not an agent', () => {
      it('should revert', async () => {
        const {
          suite: { token },
          accounts: { anotherWallet },
        } = await loadFixture(deployFullSuiteFixture);
        await expect(token.connect(anotherWallet).unfreezePartialTokens(anotherWallet.address, 1)).to.be.revertedWithCustomError(
          token,
          'CallerDoesNotHaveAgentRole',
        );
      });
    });

    describe('when sender is an agent', () => {
      describe('when amounts exceed current frozen balance', () => {
        it('should revert', async () => {
          const {
            suite: { token },
            accounts: { tokenAgent, anotherWallet },
          } = await loadFixture(deployFullSuiteFixture);
          await expect(token.connect(tokenAgent).unfreezePartialTokens(anotherWallet.address, 1)).to.be.revertedWithCustomError(
            token,
            'AmountAboveFrozenTokens',
          );
        });
      });
    });
  });
  describe('.supportsInterface()', () => {
    it('should return false for unsupported interfaces', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);

      const unsupportedInterfaceId = '0x12345678';
      expect(await token.supportsInterface(unsupportedInterfaceId)).to.equal(false);
    });

    it('should correctly identify the IERC20 interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc20InterfaceId = await interfaceIdCalculator.getIERC20InterfaceId();
      expect(await token.supportsInterface(ierc20InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IToken interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iTokenInterfaceId = await interfaceIdCalculator.getITokenInterfaceId();
      expect(await token.supportsInterface(iTokenInterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC3643 interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const iErc3643InterfaceId = await interfaceIdCalculator.getIERC3643InterfaceId();
      expect(await token.supportsInterface(iErc3643InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC173 interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc173InterfaceId = await interfaceIdCalculator.getIERC173InterfaceId();
      expect(await token.supportsInterface(ierc173InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC165 interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc165InterfaceId = await interfaceIdCalculator.getIERC165InterfaceId();
      expect(await token.supportsInterface(ierc165InterfaceId)).to.equal(true);
    });

    it('should correctly identify the IERC20Permit interface ID', async () => {
      const {
        suite: { token },
      } = await loadFixture(deployFullSuiteFixture);
      const InterfaceIdCalculator = await ethers.getContractFactory('InterfaceIdCalculator');
      const interfaceIdCalculator = await InterfaceIdCalculator.deploy();

      const ierc20PermitInterfaceId = await interfaceIdCalculator.getIERC20PermitInterfaceId();
      expect(await token.supportsInterface(ierc20PermitInterfaceId)).to.equal(true);
    });
  });
});
