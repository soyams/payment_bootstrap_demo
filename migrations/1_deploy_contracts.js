require('dotenv').config();
const CryptoPay = artifacts.require("./CryptoPay.sol");
// const Payment=artifacts.require("Payment");
module.exports =function(deployer,network,account) {
  deployer.deploy(CryptoPay,process.env.RECEIVER_ADDRESS,{from:account[0]});
  // deployer.deploy(Payment,process.env.RECEIVER_ADDRESS);
 
};
