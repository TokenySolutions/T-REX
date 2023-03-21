async function callConstant(accounts, methodInstance, isNumber) {
    let retVal = [];
    for (let i = 0; i < accounts.length; i++) {
      let currentValue;
  
      if(methodInstance == web3.eth.getBalance) {currentValue = await methodInstance(accounts[i]);}
      else {currentValue = await methodInstance.call(accounts[i]);}
  
      if(isNumber) {currentValue = currentValue.toNumber();}
      retVal.push(currentValue);
    }
    return retVal;
  }
  
  async function callMethod(sender, accounts, methodInstance, amount) {
    let gasUsed = 0;
  
    for (let i = 0; i < accounts.length; i++) {
      if(methodInstance == web3.eth.sendTransaction)
      {
        const tx = await methodInstance({from: sender, to:accounts[i], value: amount[i]});
        gasUsed += (await web3.eth.getTransaction(tx)).gas;
      }
      else {gasUsed = (await methodInstance(accounts[i], amount[i], {from: sender})).receipt.cumulativeGasUsed;}
    }
    return gasUsed;
  }
  
  function assert_(currentValue, checkValue, isNumber, diff) {
    for (let i = 0; i < currentValue.length; i++) {
      if (isNumber) {assert.equal(currentValue[i] - checkValue[i], diff);}
      else {assert.equal(currentValue[i], checkValue[i]);}
    }
  }
  
  async function isContract(accounts) {
    let retVal = []
    for (let i = 0; i < accounts.length; i++) {
      if(await web3.eth.getCode(accounts[i]) == 0x00) {
        retVal.push(false);
      } else {
        retVal.push(true);
      }
    }
    return retVal;
  }
  
  module.exports = { callConstant, callMethod, assert_, isContract }
  