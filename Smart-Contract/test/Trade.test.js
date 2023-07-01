const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const IERC20ABI = [
  // Other ABI functions...
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

describe("TradeContract", function () {
  let tradeContract;
  let traderToken;
  let counterPartyToken;
  let acc0;
  let acc1;

  beforeEach(async function () {
    [acc0, acc1] = await ethers.getSigners();
    const TradeContract = await ethers.getContractFactory("TradeContract");

    tradeContract = await TradeContract.deploy();
    await tradeContract.deployed();
  });

  it("Should match and create pending action for trade", async function () {
    // existing token contracts, you can replace with your own two mock Tokens pre-owned by the accounts, also replace hardcorded exchange rates
    traderToken = "0x6DA84c226162aBf933c18b5Ca6bC3577584bee86";
    counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";
    const rate = 30516 / 1852.4;
    const inverseRate = 1 / rate;

    console.log("BTC/ETH rate: ", rate);
    console.log("ETH/BTC rate: ", inverseRate);
    console.log("TradeContract deployed at:", tradeContract.address);
    console.log("traderToken address: ", traderToken);
    console.log("counterPartyToken address: ", counterPartyToken);

    // Update exchange rates for tokenPair and inverse tokenPair
    await tradeContract.updateExchangeRate(
      traderToken,
      counterPartyToken,
      ethers.utils.parseUnits(String(rate), 18)
    );
    await tradeContract.updateExchangeRate(
      counterPartyToken,
      traderToken,
      ethers.utils.parseUnits(String(inverseRate), 18)
    );
    console.log("exchange rates updated");

    // User 1 starts a trade
    const allowance = ethers.utils.parseUnits("300", 18);
    const transferAmount = ethers.utils.parseEther("5");
    const TokenContract = await ethers.getContractAt("IERC20", traderToken);
    await TokenContract.connect(acc0).approve(
      tradeContract.address,
      allowance,
      { gasLimit: 500000 }
    );
    const initialBalance = await TokenContract.balanceOf(acc0.address);

    // User 1 submits the trade order
    const submitTx = await tradeContract
      .connect(acc0)
      .submitTradeOrder(0, traderToken, transferAmount, counterPartyToken, {
        gasLimit: 500000,
      });

    const submitTxReceipt = await submitTx.wait();
    const finalBalanceUser1 = await TokenContract.balanceOf(acc0.address);
    const expectedFinalBalanceUser1 = initialBalance.sub(transferAmount);
    // Assert that the final balance for User 1 is equal to the expected final balance
    expect(finalBalanceUser1).to.equal(expectedFinalBalanceUser1);
    console.log(
      "first trade created and order pending. Hash: ",
      submitTxReceipt.transactionHash
    );

    // User 2 creates an inverse trade to match the first trade
    const transferAmountUser2 = ethers.utils.parseEther("2");
    const TokenContract2 = await ethers.getContractAt(
      "IERC20",
      counterPartyToken
    );
    await TokenContract2.connect(acc1).approve(
      tradeContract.address,
      allowance,
      { gasLimit: 500000 }
    );
    const initialBalanceUser2 = await TokenContract2.balanceOf(acc1.address);

    // User 2 submits the inverse trade order
    const submitTxUser2 = await tradeContract
      .connect(acc1)
      .submitTradeOrder(
        0,
        counterPartyToken,
        transferAmountUser2,
        traderToken,
        {
          gasLimit: 500000,
        }
      );

    const submitTxReceiptUser2 = await submitTxUser2.wait();
    // console.log(submitTxUser2);

    // const finalBalanceUser2 = await TokenContract2.balanceOf(acc1.address);
    // const expectedFinalBalanceUser2 =
    //   initialBalanceUser2.sub(transferAmountUser2);

    // Assert that the final balance for User 2 is equal to the expected final balance
    // expect(finalBalanceUser2).to.equal(expectedFinalBalanceUser2);
    console.log(
      "second trade matched and swap initiated. Hash: ",
      submitTxReceiptUser2.transactionHash
    );

    //Retrieve pending match
    // const pendingSwaps = await tradeContract.getPendingSwaps();
    // console.log(pendingSwaps);
  }).timeout(600000000000);
});
