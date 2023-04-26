require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');
const { deployIdentityProxy } = require('./helpers/proxy');
const {
  ClaimTopicsRegistry,
  IdentityRegistry,
  TrustedIssuersRegistry,
  IssuerIdentity,
  Token,
  Compliance,
  IdentityRegistryStorage,
  TokenProxy,
  Implementation,
  ClaimTopicsRegistryProxy,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
  TrustedIssuersRegistryProxy,
  DVDTransferManager,
  TestERC20,
  ModularCompliance,
} = require('./helpers/artifacts');

contract('DVDTransferManager', (accounts) => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let dvd;
  let usdt;
  let token;
  let implementationSC;
  let modularCompliance;
  let versionStruct;
  let contractsStruct;
  let defaultCompliance;
  let tokenName;
  let tokenSymbol;
  let tokenDecimals;
  let tokenOnchainID;
  const signer = web3.eth.accounts.create();
  const signerKey = web3.utils.keccak256(web3.eth.abi.encodeParameter('address', signer.address));
  const tokeny = accounts[0];
  const claimIssuer = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const feeWallet = accounts[4];
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  let feeWalletContract;
  const agent = accounts[8];

  before(async () => {
    usdt = await TestERC20.new('tether', 'USDT', 100000000, { from: tokeny });
    dvd = await DVDTransferManager.new({ from: tokeny });
    // Tokeny deploying all implementations
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new({ from: tokeny });
    modularCompliance = await ModularCompliance.new({ from: tokeny });
    token = await Token.new({ from: tokeny });

    // setting the implementation authority
    implementationSC = await Implementation.new(true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', {
      from: tokeny,
    });
    versionStruct = {
      major: 4,
      minor: 0,
      patch: 0,
    };
    contractsStruct = {
      tokenImplementation: token.address,
      ctrImplementation: claimTopicsRegistry.address,
      irImplementation: identityRegistry.address,
      irsImplementation: identityRegistryStorage.address,
      tirImplementation: trustedIssuersRegistry.address,
      mcImplementation: modularCompliance.address,
    };
    await implementationSC.addAndUseTREXVersion(versionStruct, contractsStruct, { from: tokeny });

    // Ctr
    const ctrProxy = await ClaimTopicsRegistryProxy.new(implementationSC.address, { from: tokeny });

    claimTopicsRegistry = await ClaimTopicsRegistry.at(ctrProxy.address);

    // Tir
    const tirProxy = await TrustedIssuersRegistryProxy.new(implementationSC.address, { from: tokeny });

    trustedIssuersRegistry = await TrustedIssuersRegistry.at(tirProxy.address);

    // Compliance
    defaultCompliance = await Compliance.new({ from: tokeny });

    // Irs
    const irsProxy = await IdentityRegistryStorageProxy.new(implementationSC.address, { from: tokeny });

    identityRegistryStorage = await IdentityRegistryStorage.at(irsProxy.address);

    // Ir

    const irProxy = await IdentityRegistryProxy.new(
      implementationSC.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
      {
        from: tokeny,
      },
    );

    identityRegistry = await IdentityRegistry.at(irProxy.address);

    tokenOnchainID = await deployIdentityProxy(tokeny);
    tokenName = 'TREXDINO';
    tokenSymbol = 'TREX';
    tokenDecimals = '0';
    // Token
    const tokenProxy = await TokenProxy.new(
      implementationSC.address,
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOnchainID.address,
      { from: tokeny },
    );
    token = await Token.at(tokenProxy.address);

    await identityRegistryStorage.bindIdentityRegistry(identityRegistry.address, { from: tokeny });
    await token.addAgent(agent, { from: tokeny });
    // Tokeny adds trusted claim Topic to claim topics registry
    await claimTopicsRegistry.addClaimTopic(7, { from: tokeny }).should.be.fulfilled;

    // Claim issuer deploying identity contract
    claimIssuerContract = await IssuerIdentity.new(claimIssuer, { from: claimIssuer });

    // Claim issuer adds claim signer key to his contract
    await claimIssuerContract.addKey(signerKey, 3, 1, { from: claimIssuer }).should.be.fulfilled;

    // Tokeny adds trusted claim Issuer to claimIssuer registry
    await trustedIssuersRegistry.addTrustedIssuer(claimIssuerContract.address, claimTopics, { from: tokeny }).should.be.fulfilled;

    // user1 deploys his identity contract
    user1Contract = await deployIdentityProxy(user1);

    // user2 deploys his identity contract
    user2Contract = await deployIdentityProxy(user2);

    // feeWallet deploys his identity contract
    feeWalletContract = await deployIdentityProxy(feeWallet);

    // identity contracts are registered in identity registry
    await identityRegistry.addAgent(agent, { from: tokeny });
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    await identityRegistry.registerIdentity(feeWallet, feeWalletContract.address, 91, {
      from: agent,
    }).should.be.fulfilled;
    await identityRegistry.registerIdentity(user2, user2Contract.address, 101, {
      from: agent,
    }).should.be.fulfilled;

    // user1 gets signature from claim issuer
    const hexedData1 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign1 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user1Contract.address, 7, hexedData1]),
    );

    const signature1 = (await signer.sign(hashedDataToSign1)).signature;

    // user1 adds claim to identity contract
    await user1Contract.addClaim(7, 1, claimIssuerContract.address, signature1, hexedData1, '', { from: user1 });

    // feeWallet gets signature from claim issuer
    const hexedDataFee = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSignFee = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [feeWalletContract.address, 7, hexedDataFee]),
    );

    const signatureFee = (await signer.sign(hashedDataToSignFee)).signature;

    // feeWallet adds claim to identity contract
    await feeWalletContract.addClaim(7, 1, claimIssuerContract.address, signatureFee, hexedDataFee, '', { from: feeWallet });

    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 7, hexedData2]),
    );

    const signature2 = (await signer.sign(hashedDataToSign2)).signature;

    // user2 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;
    await token.mint(user1, 1000, { from: agent });
    await token.unpause({ from: agent });
  });

  it('should be able to make a DVD transfer', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, zeroAddress, usdt.address, 90000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await dvd.initiateDVDTransfer(token.address, 500, user2, zeroAddress, 90000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await dvd.initiateDVDTransfer(token.address, 700, user2, usdt.address, 90000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await dvd.initiateDVDTransfer(token.address, 50000, user2, usdt.address, 90000, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(0, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    await usdt.transfer(user1, 95000, { from: user2 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    await usdt.transfer(user2, 95000, { from: user1 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('5000');
    (await usdt.balanceOf(user1)).toString().should.equal('90000');
    (await token.balanceOf(user2)).toString().should.equal('500');
    (await token.balanceOf(user1)).toString().should.equal('500');
    // reset initial state
    await token.transfer(user1, 500, { from: user2 });
    await usdt.transfer(tokeny, 90000, { from: user1 });
    await usdt.transfer(tokeny, 5000, { from: user2 });
  });

  it('should be able to set fees', async () => {
    await dvd.modifyFee(usdt.address, token.address, 1, 1, 2, feeWallet, feeWallet, { from: tokeny }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 0, 1, 2, feeWallet, feeWallet, { from: tokeny }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 3, feeWallet, feeWallet, { from: tokeny }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 1, 1, 2, feeWallet, feeWallet, { from: agent }).should.be.rejectedWith(EVMRevert);
    await token.transferOwnership(agent, { from: tokeny }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 1, 1, 2, feeWallet, feeWallet, { from: agent }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 3, feeWallet, feeWallet, { from: tokeny }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 1, feeWallet, feeWallet, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 12, feeWallet, feeWallet, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 3, zeroAddress, feeWallet, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(usdt.address, token.address, 2, 4, 3, feeWallet, zeroAddress, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(usdt.address, token.address, 200, 104, 2, feeWallet, feeWallet, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(user1, token.address, 1, 1, 2, feeWallet, feeWallet, { from: agent }).should.be.rejectedWith(EVMRevert);
    await dvd.modifyFee(token.address, user1, 1, 1, 2, feeWallet, feeWallet, { from: agent }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await token.transferOwnership(tokeny, { from: agent }).should.be.fulfilled;
    await dvd.modifyFee(usdt.address, token.address, 0, 0, 2, feeWallet, feeWallet, { from: tokeny }).should.be.fulfilled;
  });

  it('should be able to make a DVD transfer with fees on ERC20', async () => {
    await dvd.modifyFee(usdt.address, token.address, 1, 0, 2, feeWallet, user1, { from: tokeny });
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(1, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('5000');
    (await usdt.balanceOf(user1)).toString().should.equal('89100');
    (await usdt.balanceOf(feeWallet)).toString().should.equal('900');
    (await token.balanceOf(user2)).toString().should.equal('500');
    (await token.balanceOf(user1)).toString().should.equal('500');
    // reset initial state
    await dvd.modifyFee(usdt.address, token.address, 0, 0, 2, feeWallet, feeWallet, { from: tokeny });
    await token.transfer(user1, 500, { from: user2 });
    await usdt.transfer(tokeny, 5000, { from: user2 });
    await usdt.transfer(tokeny, 89100, { from: user1 });
    await usdt.transfer(tokeny, 900, { from: feeWallet });
  });

  it('should be able to make a DVD transfer with fees on TREX', async () => {
    await dvd.modifyFee(usdt.address, token.address, 0, 1, 2, feeWallet, feeWallet, { from: tokeny });
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(2, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('5000');
    (await usdt.balanceOf(user1)).toString().should.equal('90000');
    (await token.balanceOf(feeWallet)).toString().should.equal('5');
    (await token.balanceOf(user2)).toString().should.equal('495');
    (await token.balanceOf(user1)).toString().should.equal('500');
    // reset initial state
    await dvd.modifyFee(usdt.address, token.address, 0, 0, 2, feeWallet, feeWallet, { from: tokeny });
    await token.transfer(user1, 495, { from: user2 });
    await token.transfer(user1, 5, { from: feeWallet });
    await usdt.transfer(tokeny, 5000, { from: user2 });
    await usdt.transfer(tokeny, 90000, { from: user1 });
  });

  it('should detect trex tokens and get data', async () => {
    (await dvd.isTREX(usdt.address)).toString().should.equal('false');
    (await dvd.isTREX(token.address)).toString().should.equal('true');
    (await dvd.isTREXOwner(token.address, user1)).toString().should.equal('false');
    (await dvd.isTREXOwner(token.address, tokeny)).toString().should.equal('true');
    (await dvd.isTREXOwner(usdt.address, tokeny)).toString().should.equal('false');
    (await dvd.isTREXAgent(token.address, user1)).toString().should.equal('false');
    (await dvd.isTREXAgent(token.address, agent)).toString().should.equal('true');
    (await dvd.isTREXAgent(usdt.address, agent)).toString().should.equal('false');
  });

  it('should be able to delete a DVD transfer if called by taker', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(3, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.cancelDVDTransfer(txID, { from: user2 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await usdt.transfer(tokeny, 95000, { from: user2 }).should.be.fulfilled;
    await token.decreaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await usdt.decreaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
  });

  it('should be able to delete a DVD transfer if called by maker', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(4, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.cancelDVDTransfer(txID, { from: user1 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await usdt.transfer(tokeny, 95000, { from: user2 }).should.be.fulfilled;
    await token.decreaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await usdt.decreaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
  });

  it('should be able to delete a DVD transfer if called by dvd owner', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(5, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.cancelDVDTransfer(txID, { from: tokeny }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await usdt.transfer(tokeny, 95000, { from: user2 }).should.be.fulfilled;
    await token.decreaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await usdt.decreaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
  });

  it('should be able to delete a DVD transfer if called by trex agent', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(6, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.cancelDVDTransfer(txID, { from: feeWallet }).should.be.rejectedWith(EVMRevert);
    await dvd.cancelDVDTransfer(txID, { from: agent }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID, { from: user2 }).should.be.rejectedWith(EVMRevert);
    const txID2 = await dvd.calculateTransferID(6, user1, usdt.address, 500, user2, usdt.address, 90000);
    await dvd.cancelDVDTransfer(txID2, { from: agent }).should.be.rejectedWith(EVMRevert);
    const txID3 = await dvd.calculateTransferID(6, zeroAddress, zeroAddress, 500, user2, zeroAddress, 90000);
    await dvd.calculateFee(txID3).should.be.rejectedWith(EVMRevert);
    await dvd.cancelDVDTransfer(txID3, { from: agent }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await usdt.transfer(tokeny, 95000, { from: user2 }).should.be.fulfilled;
    await token.decreaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await usdt.decreaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
  });

  it('TREX agent should be able to take a DVD transfer after approval from taker (conditional process)', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 500, user2, usdt.address, 90000, { from: user1 }).should.be.fulfilled;
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    const txID = await dvd.calculateTransferID(7, user1, token.address, 500, user2, usdt.address, 90000);
    await dvd.takeDVDTransfer(txID, { from: user1 }).should.be.rejectedWith(EVMRevert);
    await dvd.takeDVDTransfer(txID, { from: agent }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('5000');
    (await usdt.balanceOf(user1)).toString().should.equal('90000');
    (await token.balanceOf(user2)).toString().should.equal('500');
    (await token.balanceOf(user1)).toString().should.equal('500');
    // reset initial state
    await usdt.transfer(tokeny, 5000, { from: user2 }).should.be.fulfilled;
    await usdt.transfer(tokeny, 90000, { from: user1 }).should.be.fulfilled;
    await token.transfer(user1, 500, { from: user2 }).should.be.fulfilled;
  });

  it('should be able to make 2 identical DVD transfers in parallel', async () => {
    await usdt.transfer(user2, 95000, { from: tokeny }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('95000');
    await token.increaseAllowance(dvd.address, 500, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 250, user2, usdt.address, 45000, { from: user1 }).should.be.fulfilled;
    await dvd.initiateDVDTransfer(token.address, 250, user2, usdt.address, 45000, { from: user1 }).should.be.fulfilled;
    const txID1 = await dvd.calculateTransferID(8, user1, token.address, 250, user2, usdt.address, 45000);
    const txID2 = await dvd.calculateTransferID(9, user1, token.address, 250, user2, usdt.address, 45000);
    await usdt.increaseAllowance(dvd.address, 90000, { from: user2 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID1, { from: user2 }).should.be.fulfilled;
    await dvd.takeDVDTransfer(txID2, { from: user2 }).should.be.fulfilled;
    (await usdt.balanceOf(user2)).toString().should.equal('5000');
    (await usdt.balanceOf(user1)).toString().should.equal('90000');
    (await token.balanceOf(user2)).toString().should.equal('500');
    (await token.balanceOf(user1)).toString().should.equal('500');
    // reset initial state
    await usdt.transfer(tokeny, 5000, { from: user2 }).should.be.fulfilled;
    await usdt.transfer(tokeny, 90000, { from: user1 }).should.be.fulfilled;
    await token.transfer(user1, 500, { from: user2 }).should.be.fulfilled;
  });
});
