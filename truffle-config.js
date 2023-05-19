require('dotenv').config();
const HDWalletProvider=require("@truffle/hdwallet-provider");

module.exports = {

  networks: {
    development: {
      host: process.env.LOCAL_HOST,
      port: process.env.LOCAL_PORT,
      network_id: "*"// Match any network id
    },
    goerli:{
      provider:new HDWalletProvider(process.env.MNEMONICS,process.env.RPC_URL_GOERLI+process.env.INFURA_API_KEY),
      network_id:5,
      skipDryRun:true
    },
    sepolia:{
      provider:new HDWalletProvider(process.env.MNEMONICS,process.env.RPC_URL_SEPOLIA+process.env.INFURA_API_KEY),
      network_id:11155111,
      timeoutBlock:20,
      skipDryRun:true
    }
  },
  compilers:{
    solc:{
      version:"^0.8.19"
    }
  }
};
