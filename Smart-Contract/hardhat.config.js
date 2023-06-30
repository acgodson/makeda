require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    // settings: {
    //   optimizer: {
    //     enabled: true,
    //     runs: 200,
    //   },
    // },
  },
  defaultNetwork: "zen",
  networks: {
    zen: {
      chainId: 1663,
      url: process.env.HORIZEN_RPC_URL,
      accounts: [
        process.env.ACCOUNT2,
        process.env.ACCOUNT1,
        process.env.ACCOUNT3,
      ],
      gasPrice: "auto",
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL,
      accounts: [
        process.env.ACCOUNT2,
        process.env.ACCOUNT1,
        process.env.ACCOUNT3,
        process.env.ACCOUNT4,
      ],
    },
    calibrationnet: {
      chainId: 314159,
      url: process.env.CALIBRATIONNET_RPC_URL,
      accounts: [
        process.env.ACCOUNT2,
        process.env.ACCOUNT1,
        process.env.ACCOUNT3,
        process.env.ACCOUNT4,
      ],
    },
    horizen: {
      chainId: 1663,
      url: process.env.HORIZEN_RPC_URL,
      accounts: [
        process.env.ACCOUNT1,
        process.env.ACCOUNT2,
        process.env.ACCOUNT3,
        process.env.ACCOUNT4,
      ],
    },
  },
  etherscan: {
    // apiKey: {
    //   polygonMumbai: process.env.POLYGON_API_KEY,
    //   optimisticGoerli: process.env.OPTIMISM_API_KEY,
    //   bscTestnet: process.env.BSC_API_KEY,
    //   goerli: process.env.GOERLI_API_KEY,
    //   sepolia: process.env.GOERLI_API_KEY,
    //   arbitrumGoerli: process.env.ARBITRUM_API_KEY,
    //   avalancheFujiTestnet: process.env.AVALANCHE_API_KEY,
    //   moonbaseAlpha: process.env.MOONBASE_API_KEY,
    // },
  },
};
