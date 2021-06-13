
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
    apiKey: "X4AAIDNTXZGRM52NNMWFKZ9CRIGJHAUAGS"
  },
  networks: {
    hardhat: {
      gas: 3000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
      forking: {
        //url: "https://mainnet.infura.io/v3/e0a0a746fae345089d1c9c9870a80bd2"
        url: "https://kovan.infura.io/v3/e0a0a746fae345089d1c9c9870a80bd2"
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
      gasPrice: 3000000000,
      allowUnlimitedContractSize: true,
      timeout: 600000,
      url: `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.KOVAN_OWNER}`, `0x${process.env.KOVAN_PROXY_ADMIN}`]
    },
    mainnet: {
      gas: 80000000000,
      gasPrice: 20000000000,
      allowUnlimitedContractSize: true,
      timeout: 600000,
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [`0x${process.env.MAINNET_OWNER}`, `0x${process.env.MAINNET_PROXY_ADMIN}`]
    },
  }
};
