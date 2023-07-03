const { expect } = require("chai");
const { ethers } = require("hardhat");

// const  traderToken = "0x6DA84c226162aBf933c18b5Ca6bC3577584bee86";
//  const counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

const traderToken = "0xe7dCfABAFBe09D7D9081E44de4Ad7203f88BF28F";
const counterPartyToken = "0xd85b13920b03d6998700cf52f0F2cdF702f0896E";

const tradeABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "counterParty",
        type: "address",
      },
    ],
    name: "SwapBegun",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "SwapCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "SwapCompleted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "cancelSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "completeSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "fulfillments",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "payer",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPendingSwaps",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "initiatorTradeID",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "counterPartyTradeID",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            internalType: "address",
            name: "counterParty",
            type: "address",
          },
          {
            internalType: "address",
            name: "initiatorToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "counterPartyToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "initiatorAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "counterPartyAmount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "initiated",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "completed",
            type: "bool",
          },
        ],
        internalType: "struct SwapERC20.Swap[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "pairHash",
        type: "bytes32",
      },
    ],
    name: "getSortedIdsDesc",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tradeId",
        type: "uint256",
      },
    ],
    name: "getTrade",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "initiatorAmount",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "initiatorToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "counterPartyToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "counterPartyAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "enum TradeHelper.State",
            name: "state",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct TradeHelper.Trade",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_prices",
        type: "uint256[]",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "pairs",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "counterPartyAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "size",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "initiatorToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "initiatorAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
    ],
    name: "submitTradeOrder",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "initiator",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "initiatorAmount",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "initiatorToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "counterPartyToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "counterPartyAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "enum TradeHelper.State",
            name: "state",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct TradeHelper.Trade",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "swapCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "swapIdsByAddress",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "swaps",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "initiatorTradeID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "counterPartyTradeID",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        internalType: "address",
        name: "counterParty",
        type: "address",
      },
      {
        internalType: "address",
        name: "initiatorToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "initiatorAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "counterPartyAmount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "initiated",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "completed",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "tokenPrices",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tradeCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "trades",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "initiatorAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "initiatorToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "counterPartyAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "enum TradeHelper.State",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "updateTokenPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

describe("Simple Makeda Contract", function () {
  let space;
  let tradeContract;
  let acc0;
  let acc1;

  beforeEach(async function () {
    [acc0, acc1] = await ethers.getSigners();
    const TradeFactory = await ethers.getContractFactory("TradeFactory");
    const tradeFactory = await TradeFactory.deploy({
      gasLimit: 5000000,
    });
    await tradeFactory.deployed();
    //create space and deploy escrow
    const create = await tradeFactory.createSpace(
      [traderToken, counterPartyToken], //mock tokens
      [30516, 1852], //mock prices
      {
        gasLimit: 6000000,
      }
    );
    await create.wait();
    const spaces = await tradeFactory.getSpaces(acc0.address);
    const escrowAddress = spaces[0][1];
    console.log("Escrow contract deployed at: ", escrowAddress);

    tradeContract = new ethers.Contract(
      escrowAddress,
      tradeABI,
      ethers.provider.getSigner()
    );
  });

  it("Should match and complete trade", async function () {
    const transferAmount = ethers.utils.parseEther("3");
    const transferAmountUser2 = ethers.utils.parseEther("3");

    //User one gives allowance and submits trade
    const allowance = ethers.utils.parseUnits("100", 18);
    const TokenContract = await ethers.getContractAt("IERC20", traderToken);
    await TokenContract.connect(acc0).approve(
      tradeContract.address,
      allowance,
      { gasLimit: 5000000 }
    );

    const submitTx = await tradeContract.submitTradeOrder(
      traderToken,
      transferAmount,
      counterPartyToken,
      {
        gasLimit: 5000000,
      }
    );

    const submitTxReceipt = await submitTx.wait();
    console.log(
      "First trade created and order pending. Hash:",
      submitTxReceipt.transactionHash
    );

    // User 2 gives allowance and submits the inverse trade
    const TokenContract2 = await ethers.getContractAt(
      "IERC20",
      counterPartyToken
    );
    await TokenContract2.connect(acc1).approve(
      tradeContract.address,
      allowance
    );

    const submitTxUser2 = await tradeContract
      .connect(acc1)
      .submitTradeOrder(counterPartyToken, transferAmountUser2, traderToken, {
        gasLimit: 5000000,
      });

    const submitTxReceiptUser2 = await submitTxUser2.wait();
    console.log(
      "Second trade matched and swap initiated. Hash:",
      submitTxReceiptUser2.transactionHash
    );
    const completeSwap = await tradeContract
      .connect(acc0)
      .completeSwap(0, { gasLimit: 500000 });

    const swapReceipt = await completeSwap.wait();
    console.log("swap completed", swapReceipt.transactionHash);
    const swap = await tradeContract.swaps(0);
    console.log(swap);
  }).timeout(600000000000);
});
