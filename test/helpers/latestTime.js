// Returns the time of the last mined block in seconds
module.exports = function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
};
