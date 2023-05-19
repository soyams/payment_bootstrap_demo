// require('dotenv').config();
var CryptoPay = artifacts.require("./CryptoPay.sol");
// console.log(process.env.RECEIVER_ADDRESS)
module.exports = function(deployer,network,accounts) {
  deployer.deploy(CryptoPay);
  // deployer.deploy(CryptoPay(process.env.RECEIVER_ADDRESS));
};
