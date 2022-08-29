
const dotenv = require('dotenv');
dotenv.config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    version: "0.7.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  },
  networks: {
    hardhat: {
      //mining: {
      //  auto: false,
      //  interval: 100
      //},
      //gas: 30000000000,
      //gasLimit: 600000,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      chainId: 1,
      //chainId: 137,
      //chainId: 3,
      forking: {
        //url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
        //url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID}`, 
      }
    },
    
    rinkeby: {
      gas: 10000000000,
      allowUnlimitedContractSize: true,
      timeout: 600000,
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.RINKEBY_OWNER}`, `0x${process.env.RINKEBY_PROXY_ADMIN}`]
    },
    kovan: {
      gas: 10000000000,
      gasPrice: 1000000000,
      allowUnlimitedContractSize: true,
      timeout: 6000000,
      url: `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.KOVAN_OWNER}`, `0x${process.env.KOVAN_PROXY_ADMIN}`]
    },
    ropsten: {
      gas: 10000000000,
      gasPrice: 10000000000,
      allowUnlimitedContractSize: true,
      timeout: 6000000,
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.ROPSTEN_OWNER}`, `0x${process.env.ROPSTEN_PROXY_ADMIN}`]
    },
    mainnet: {
      gas: 80000000000,
      gasPrice: 158000000000,
      allowUnlimitedContractSize: true,
      timeout: 600000,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    },
    polygon: {
      gas: 80000000000,
      gasPrice: 75000000000,
      allowUnlimitedContractSize: true,
      timeout: 6000000,
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gasPrice: 25000000000,
      chainId: 43114,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    },
    bsc: {
      url: "https://bsc-dataseed1.ninicoin.io",
      gasPrice: 5000000000,
      chainId: 56,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    },
    fantom: {
      url: "https://rpc.ftm.tools",
      gasPrice: 1130000000000,
      chainId: 250,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    }
  }
};
