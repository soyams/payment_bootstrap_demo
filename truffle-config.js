require('dotenv').config();
const HDWalletProvider=require("@truffle/hdwallet-provider");

module.exports = {
  contracts_directory:"./contracts",
  contracts_build_directory:"./src/build/contracts",
  migrations_directory:"./migrations",
  networks: {
    development: {
      host: process.env.LOCAL_HOST,
      port: process.env.LOCAL_PORT,
      network_id: "*"// Match any network id
    },
    develop:{
      host:"127.0.0.1",
      port:8545
    },
    goerli:{
      provider:new HDWalletProvider(process.env.MNEMONICS,process.env.RPC_URL_GOERLI+process.env.INFURA_API_KEY),
      network_id:5,
      skipDryRun:true,
      gas: 2100000,
      gasPrice: 8000000000
    },
    sepolia:{
      provider:new HDWalletProvider(process.env.MNEMONICS,process.env.RPC_URL_SEPOLIA+process.env.INFURA_API_KEY),
      network_id:11155111,
      timeoutBlock:20,
      skipDryRun:true,
      gas: 2100000,
      gasPrice: 8000000000
    }
  },
  compilers:{
    solc:{
      version:"^0.8.19"
    }
  }
};
