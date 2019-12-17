const log = require("./helpers/logger");
const EVMRevert = require("./helpers/VMExceptionRevert");

const should = require("chai")
  .use(require("chai-as-promised"))
  .should();

const ClaimTopicsRegistry = artifacts.require(
  "../contracts/registry/ClaimTopicsRegistry.sol"
);
const IdentityRegistry = artifacts.require(
  "../contracts/registry/IdentityRegistry.sol"
);
const TrustedIssuersRegistry = artifacts.require(
  "../contracts/registry/TrustedIssuersRegistry.sol"
);
const ClaimHolder = artifacts.require(
  "@onchain-id/solidity/contracts/Identity.sol"
);
const IssuerIdentity = artifacts.require(
  "../contracts/claimIssuer/ClaimIssuer.sol"
);

contract("ClaimTopicsRegistry", accounts => {
  let claimTopicsRegistry;

  beforeEach(async () => {
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    await claimTopicsRegistry.addClaimTopic(1);
  });

  it("Add claimTopic should pass if valid claim topic is provided", async () => {
    let tx = await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    log(`Cumulative gas cost for claim topic addition ${tx.receipt.gasUsed}`);
  });

  it("Add claimTopic should fail if called by non-owner", async () => {
    await claimTopicsRegistry
      .addClaimTopic(2, { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
  });

  it("Add claimTopic should fail if claim topic provided is not unique", async () => {
    await claimTopicsRegistry
      .addClaimTopic(1)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Remove claimTopic should pass if the claim topic provided exists", async () => {
    await claimTopicsRegistry.addClaimTopic(2).should.be.fulfilled;
    let tx = await claimTopicsRegistry.removeClaimTopic(2).should.be.fulfilled;
    log(`Cumulative gas cost for claim topic removal ${tx.receipt.gasUsed}`);
  });

  it("Add claimTopic should fail if called by non-owner", async () => {
    await claimTopicsRegistry
      .addClaimTopic(2, { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
  });
});

contract("IdentityRegistry", accounts => {
  let trustedIssuersRegistry;
  let claimTopicsRegistry;
  let identityRegistry;
  let claimHolder;
  let claimHolder2;
  let claimHolder3;

  beforeEach(async () => {
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0]
    });
    claimTopicsRegistry = await ClaimTopicsRegistry.new({ from: accounts[0] });
    identityRegistry = await IdentityRegistry.new(
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      { from: accounts[0] }
    );
    claimHolder = await ClaimHolder.new({ from: accounts[1] });
    claimHolder2 = await ClaimHolder.new({ from: accounts[2] });
    await identityRegistry.addAgent(accounts[0]);
    await identityRegistry.registerIdentity(
      accounts[1],
      claimHolder.address,
      91
    );
  });

  it("Register Identity passes for unique identity", async () => {
    let tx = await identityRegistry.registerIdentity(
      accounts[2],
      claimHolder2.address,
      91
    ).should.be.fulfilled;
    log(`Cumulative gas cost for identity registration ${tx.receipt.gasUsed}`);
  });

  it("Register Identity should fail if user address already exists", async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    await identityRegistry
      .registerIdentity(accounts[1], claimHolder3.address, 91)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Update Identity should pass if valid parameters are provided", async () => {
    claimHolder3 = await ClaimHolder.new({ from: accounts[1] });
    let tx = await identityRegistry.updateIdentity(
      accounts[1],
      claimHolder3.address
    ).should.be.fulfilled;
    log(`Cumulative gas cost for identity updation ${tx.receipt.gasUsed}`);
  });

  it("Update Identity should fail if user address does not exist already", async () => {
    await identityRegistry
      .updateIdentity(accounts[2], claimHolder2.address)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Delete identity should pass if valid user address is provided", async () => {
    let tx = await identityRegistry.deleteIdentity(accounts[1]).should.be
      .fulfilled;
    log(`Cumulative gas cost for identity deletion ${tx.receipt.gasUsed}`);
  });

  it("Delete Identity should fail if provided user is not valid", async () => {
    await identityRegistry
      .deleteIdentity(accounts[2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Updates the country for a registered identity", async () => {
    await identityRegistry.updateCountry(accounts[1], 101, {
      from: accounts[0]
    }).should.be.fulfilled;
  });

  it("Updates the Claim Topics Registry", async () => {
    newClaimTopicsRegistry = await ClaimTopicsRegistry.new({
      from: accounts[0]
    });
    await identityRegistry.setClaimTopicsRegistry(
      newClaimTopicsRegistry.address,
      { from: accounts[0] }
    );
  });

  it("Updates the Trusted Issuers Registry", async () => {
    newTrustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0]
    });
    await identityRegistry.setTrustedIssuersRegistry(
      newTrustedIssuersRegistry.address,
      { from: accounts[0] }
    );
  });

  it("Register Identity should fail if zero address provided", async () => {
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    await identityRegistry
      .registerIdentity(accounts[1], zeroAddress, 91)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Update Identity should fail if zero address provided", async () => {
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    await identityRegistry
      .updateIdentity(accounts[1], zeroAddress)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Update country should fail if no identity exists", async () => {
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    await identityRegistry
      .updateCountry(accounts[2], 101)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Should fail if zero address provided to contains", async () => {
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    await identityRegistry
      .contains(zeroAddress)
      .should.be.rejectedWith(EVMRevert);
  });
});

contract("TrustedIssuersRegistry", accounts => {
  let trustedIssuersRegistry;
  let trustedIssuer1;
  let trustedIssuer2;

  beforeEach(async () => {
    trustedIssuersRegistry = await TrustedIssuersRegistry.new({
      from: accounts[0]
    });
    trustedIssuer1 = await IssuerIdentity.new({ from: accounts[1] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer1.address, 1, [
      1
    ]);
  });

  it("Add trusted issuer should pass if valid credentials are provided", async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    let tx = await trustedIssuersRegistry.addTrustedIssuer(
      trustedIssuer2.address,
      2,
      [2]
    ).should.be.fulfilled;
    log(`Cumulative gas cost for adding trusted issuer ${tx.receipt.gasUsed}`);
    let issuers = await trustedIssuersRegistry.getTrustedIssuers();
    log(`Issuers are: ${issuers}`);
  });

  it("Add trusted issuer should fail if invalid credentials are provided", async () => {
    let zeroAddress = "0x0000000000000000000000000000000000000000";
    let tx = await trustedIssuersRegistry
      .addTrustedIssuer(zeroAddress, 2, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Add trusted Issuer should fail if trusted issuer index provided already exists", async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry
      .addTrustedIssuer(trustedIssuer2.address, 1, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Add trusted Issuer should fail if trusted issuer address provided already exists", async () => {
    await trustedIssuersRegistry
      .addTrustedIssuer(trustedIssuer1.address, 2, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Remove trusted issuer should pass if a trusted issuer exists", async () => {
    let tx = await trustedIssuersRegistry.removeTrustedIssuer(1).should.be
      .fulfilled;
    log(
      `Cumulative gas cost for removing trusted issuer ${tx.receipt.gasUsed}`
    );
  });

  it("Remove trusted issuer should fail if a trusted issuer does not exist", async () => {
    await trustedIssuersRegistry
      .removeTrustedIssuer(2)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Add trusted Issuer should fail if trusted issuer index provided is invalid", async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry
      .addTrustedIssuer(trustedIssuer2.address, 0, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Add trusted Issuer should fail if no claim topic is provided", async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry
      .addTrustedIssuer(trustedIssuer2.address, 1, [])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Should update trusted issuer if a trusted issuer exists", async () => {
    let newTrustedIssuer = await IssuerIdentity.new({ from: accounts[2] });
    let tx = await trustedIssuersRegistry.updateIssuerContract(
      1,
      newTrustedIssuer.address,
      [2]
    ).should.be.fulfilled;
    log(
      `Cumulative gas cost for removing trusted issuer ${tx.receipt.gasUsed}`
    );
  });

  it("Should revert update trusted issuer if no claim topic provided", async () => {
    let newTrustedIssuer = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry
      .updateIssuerContract(1, newTrustedIssuer.address, [])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Should revert update trusted issuer if trusted issuer does not exist", async () => {
    await trustedIssuersRegistry
      .updateIssuerContract(0, trustedIssuer1.address, [2])
      .should.be.rejectedWith(EVMRevert);
    await trustedIssuersRegistry
      .updateIssuerContract(2, trustedIssuer1.address, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Should revert update trusted issuer if trusted issuer address is already registered", async () => {
    await trustedIssuersRegistry
      .updateIssuerContract(1, trustedIssuer1.address, [2])
      .should.be.rejectedWith(EVMRevert);
  });

  it("Should return true if trusted issuer exists at an index", async () => {
    let trustedIssuer = await trustedIssuersRegistry.getTrustedIssuer(1).should
      .be.fulfilled;
  });

  it("Should return claim topics if trusted issuer exist", async () => {
    let claimTopics = await trustedIssuersRegistry.getTrustedIssuerClaimTopics(
      1
    );
    log(`Claim topics ${claimTopics}`);
  });

  it("Should revert if no trusted issuer exist at given index", async () => {
    await trustedIssuersRegistry
      .getTrustedIssuer(2)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Remove trusted issuer should fail if index is invalid", async () => {
    await trustedIssuersRegistry
      .getTrustedIssuer(0)
      .should.be.rejectedWith(EVMRevert);
    await trustedIssuersRegistry
      .removeTrustedIssuer(0)
      .should.be.rejectedWith(EVMRevert);
  });

  it("Remove trusted issuer should pass if a trusted issuer exist", async () => {
    trustedIssuer2 = await IssuerIdentity.new({ from: accounts[2] });
    await trustedIssuersRegistry.addTrustedIssuer(trustedIssuer2.address, 2, [
      0,2
    ]).should.be.fulfilled;
    let tx = await trustedIssuersRegistry.removeTrustedIssuer(2).should.be
      .fulfilled;
    log(
      `Cumulative gas cost for removing trusted issuer ${tx.receipt.gasUsed}`
    );
  });

  it("Should revert if index is invalid", async () => {
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(0).should.be.rejectedWith(EVMRevert);
  });

  it("Should revert if no trusted issuer exists at given index", async () => {
    await trustedIssuersRegistry.getTrustedIssuerClaimTopics(2).should.be.rejectedWith(EVMRevert);
  });

  it("Should revert if claim topic is invalid", async () => {
    await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 0).should.be.rejectedWith(EVMRevert);
  });

  it("Should return false if trusted issuer does not have claim topic", async () => {
    let result = await trustedIssuersRegistry.hasClaimTopic(trustedIssuer1.address, 2).should.be.fulfilled;
    result.should.equal(false);
  });

});
