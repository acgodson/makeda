require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    fantom: {
      url: `https://rpc.testnet.fantom.network`,
      chainId: 4002,
      accounts: [
        process.env.ACCOUNT2,
        process.env.ACCOUNT1,
        process.env.ACCOUNT3,
        process.env.ACCOUNT4,
      ],
    },
    zen: {
      chainId: 1663,
      url: process.env.HORIZEN_RPC_URL,
      accounts: [
        process.env.ACCOUNT1,
        process.env.ACCOUNT2,
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
  },
};
