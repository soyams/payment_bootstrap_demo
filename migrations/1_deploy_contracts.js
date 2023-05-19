var CryptoPay = artifacts.require("./CryptoPay.sol");

module.exports = function(deployer,network,accounts) {
  deployer.deploy(CryptoPay);
};
