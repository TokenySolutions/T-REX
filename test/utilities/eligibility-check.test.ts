import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployFullSuiteFixture } from '../fixtures/deploy-full-suite.fixture';

describe('EligibilityChecker', () => {
  it('', async () => {
    const {
      suite: { identityRegistry },
      accounts: { deployer },
    } = await loadFixture(deployFullSuiteFixture);
  });
});
