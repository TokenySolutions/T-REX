const gWeiToETH = 1 / 1000000000;
function calculateETH(gasAverage, gasUnits) {
  const res = Math.round(gasUnits * gWeiToETH * gasAverage * 10000) / 10000;
  return res.toFixed(4);
}

module.exports = {
  calculateETH,
  gWeiToETH,
};
