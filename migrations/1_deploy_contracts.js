require('dotenv').config();
var CryptoPay = artifacts.require("./CryptoPay.sol");
module.exports = function(deployer,network,accounts) {
  deployer.deploy(CryptoPay,process.env.RECEIVER_ADDRESS);
};
