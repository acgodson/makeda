export const tradeAddress = "0x0EAED3345c0D6F18342ff982a9b53E5b041303Fd";
export const BTCAddress = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276"; // Address of Bitcoin
export const ETHAddress = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

export const shortenAddress = (address) => {
  if (!address) {
    return;
  }
  if (address.length < 10) return address; // Handle invalid address length

  return address.slice(0, 6) + "..." + address.slice(-4);
};

export const tradeABI = [
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
      {
        indexed: false,
        internalType: "address",
        name: "initiatorToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "initiatorAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "counterPartyAmount",
        type: "uint256",
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
    name: "SwapCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tradeId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "fulfiller",
        type: "address",
      },
    ],
    name: "SwapCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tradeId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "counterParty",
        type: "address",
      },
    ],
    name: "TradeOrderSubmitted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "pendingActionId",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "exchangeRates",
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
        name: "traderToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "traderAmount",
        type: "uint256",
      },
    ],
    name: "getCounterPartyAmount",
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
        name: "tokenA",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenB",
        type: "address",
      },
    ],
    name: "getExchangeRate",
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
        name: "account",
        type: "address",
      },
    ],
    name: "getSwaps",
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
        internalType: "struct TradeContract.Swap[]",
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "pendingActions",
    outputs: [
      {
        internalType: "uint256",
        name: "tradeId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fulfillerTradeId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "fulfiller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "swapID",
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
        name: "traderToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "traderAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "counterPartyToken",
        type: "address",
      },
    ],
    name: "submitTradeOrder",
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
    ],
    name: "swapContracts",
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
        name: "counterParty",
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
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenA",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenB",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
    ],
    name: "updateExchangeRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const erc20ABI = [
  // Read-only functions
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_value", type: "uint256" }],
    name: "burn",
    outputs: [{ name: "success", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const handleOpenExplorer = (address) => {
  window.open(`https://goerli.etherscan.io/address/${address}`, "_blank");
};
