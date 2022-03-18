const { deployIdentityProxy } = require('./helpers/proxy');

const log = require('./helpers/logger');
require('chai').use(require('chai-as-promised')).should();
const EVMRevert = require('./helpers/VMExceptionRevert');
const {
  ClaimTopicsRegistry,
  Compliance,
  IdentityRegistry,
  IdentityRegistryStorage,
  Implementation,
  IssuerIdentity,
  Token,
  TrustedIssuersRegistry,
  TokenProxy,
  ClaimTopicsRegistryProxy,
  IdentityRegistryProxy,
  IdentityRegistryStorageProxy,
  TrustedIssuersRegistryProxy,
} = require('./helpers/artifacts');

contract('Compliance', (accounts) => {
  let claimTopicsRegistry;
  let identityRegistry;
  let identityRegistryStorage;
  let trustedIssuersRegistry;
  let claimIssuerContract;
  let token;
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
  const claimTopics = [1, 7, 3];
  let user1Contract;
  let user2Contract;
  const agent = accounts[8];

  before(async () => {
    // Tokeny deploying token
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: tokeny });
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({ from: tokeny });
    identityRegistryStorage = await IdentityRegistryStorage.new({ from: tokeny });
    identityRegistry = await IdentityRegistry.new({ from: tokeny });

    token = await Token.new({ from: tokeny });

    // Implementation
    const implementationSC = await Implementation.new({ from: tokeny });

    await implementationSC.setCTRImplementation(claimTopicsRegistry.address);

    await implementationSC.setTIRImplementation(trustedIssuersRegistry.address);

    await implementationSC.setIRSImplementation(identityRegistryStorage.address);

    await implementationSC.setIRImplementation(identityRegistry.address);

    await implementationSC.setTokenImplementation(token.address);

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
    // identity contracts are registered in identity registry
    await identityRegistry.addAgent(agent, { from: tokeny });
    await identityRegistry.registerIdentity(user1, user1Contract.address, 91, {
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
    // user2 gets signature from claim issuer
    const hexedData2 = await web3.utils.asciiToHex('Yea no, this guy is totes legit');
    const hashedDataToSign2 = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(['address', 'uint256', 'bytes'], [user2Contract.address, 7, hexedData2]),
    );
    const signature2 = (await signer.sign(hashedDataToSign2)).signature;
    // user2 adds claim to identity contract
    await user2Contract.addClaim(7, 1, claimIssuerContract.address, signature2, hexedData2, '', { from: user2 }).should.be.fulfilled;
    await token.setCompliance(defaultCompliance.address, { from: tokeny });
    await defaultCompliance.bindToken(token.address, { from: tokeny });
    await defaultCompliance.addTokenAgent(agent, { from: tokeny });
  });

  it('test default compliance methods', async () => {
    (await token.compliance()).should.be.equal(defaultCompliance.address);
    await defaultCompliance.bindToken(token.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    (await defaultCompliance.isTokenBound(token.address)).should.be.equal(true);
    await defaultCompliance.unbindToken(token.address, { from: tokeny });
    await defaultCompliance.unbindToken(token.address, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    (await defaultCompliance.isTokenBound(token.address)).should.be.equal(false);
    await defaultCompliance.addTokenAgent(agent, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    (await defaultCompliance.isTokenAgent(agent)).should.be.equal(true);
    await defaultCompliance.removeTokenAgent(agent, { from: tokeny });
    await defaultCompliance.removeTokenAgent(agent, { from: tokeny }).should.be.rejectedWith(EVMRevert);
    // reset initial state
    await defaultCompliance.bindToken(token.address, { from: tokeny });
    await defaultCompliance.addTokenAgent(agent, { from: tokeny });
  });

  it('Should transfer ownership of the compliance contract', async () => {
    const tx = await defaultCompliance.transferOwnershipOnComplianceContract(user1, { from: tokeny }).should.be.fulfilled;
    (await defaultCompliance.owner()).should.equal(user1);
    log(`${tx.receipt.gasUsed} gas units used to transfer Compliance ownership`);
    // reset initial state
    await defaultCompliance.transferOwnershipOnComplianceContract(tokeny, { from: user1 }).should.be.fulfilled;
  });
});
