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
  let acc2;
  let traderAmount;

  beforeEach(async function () {
    [acc0, acc1, acc2] = await ethers.getSigners();
    const TradeContract = await ethers.getContractFactory("TradeContract");

    tradeContract = await TradeContract.deploy();
    await tradeContract.deployed();
  });

  // it("Should submit trade order", async function () {
  //   //  existing token contracts
  //   traderToken = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276";
  //   counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

  //   console.log("TradeContract deployed at:", tradeContract.address);

  //   console.log("submitting");
  //   console.log("traderToken address", traderToken);
  //   console.log("counterPartyToken address", counterPartyToken);

  //   const rate = ethers.utils.parseUnits(String(30516 / 1852.4), 18);
  //   const allowance = ethers.utils.parseUnits("300", 18);
  //   const transferAmount = ethers.utils.parseEther("5");
  //   const TokenContract = await ethers.getContractAt("IERC20", traderToken);

  //   await TokenContract.connect(acc0).approve(
  //     tradeContract.address,
  //     allowance,
  //     { gasLimit: 500000 }
  //   );

  //   const initialBalance = await TokenContract.balanceOf(acc0.address);

  //   // // update exchange rate
  //   await tradeContract.updateExchangeRate(
  //     traderToken,
  //     counterPartyToken,
  //     rate
  //   );

  //   // Call the submitTradeOrder function
  //   const submitTx = await tradeContract
  //     .connect(acc0)
  //     .submitTradeOrder(0, traderToken, transferAmount, counterPartyToken, {
  //       gasLimit: 500000,
  //     });

  //   const submitTxReceipt = await submitTx.wait();

  //   // Get the emitted events

  //   const tradeID = submitTxReceipt.events[0].data;
  //   const trade = tradeContract.trades(0);
  //   console.log(await trade);

  //   const finalBalance = await TokenContract.balanceOf(acc0.address);
  //   const expectedFinalBalance = initialBalance.sub(transferAmount);
  //   // Assert that the final balance is equal to the expected final balance
  //   expect(finalBalance).to.equal(expectedFinalBalance);
  // }).timeout(600000000000);

  it("Should match and create pending action for trade", async function () {
    // existing token contracts
    traderToken = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276";
    counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";
    console.log("TradeContract deployed at:", tradeContract.address);
    console.log("submitting");
    console.log("traderToken address", traderToken);
    console.log("counterPartyToken address", counterPartyToken);

    // User 1 creates a trade
    const rate = ethers.utils.parseUnits(String(30516 / 1852.4), 18);
    const inverseRate = ethers.utils.parseUnits(String(30516 / 1852.4), 18);
    const allowance = ethers.utils.parseUnits("300", 18);
    const transferAmount = ethers.utils.parseEther("5");
    const TokenContract = await ethers.getContractAt("IERC20", traderToken);

    // Update exchange rate
    await tradeContract.updateExchangeRate(
      traderToken,
      counterPartyToken,
      rate
    );

    await tradeContract.updateExchangeRate(
      counterPartyToken,
      traderToken,
      inverseRate
    );

    console.log("exchange rates updated");

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

    console.log("first transaction done");

    // User 2 creates an inverse trade to match the first trade
    const transferAmountUser2 = ethers.utils.parseEther("5");

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

    // Get the emitted events
    const tradeUser2 = await tradeContract.trades(1);

    const finalBalanceUser2 = await TokenContract2.balanceOf(acc1.address);
    const expectedFinalBalanceUser2 =
      initialBalanceUser2.sub(transferAmountUser2);

    // Assert that the final balance for User 2 is equal to the expected final balance
    expect(finalBalanceUser2).to.equal(expectedFinalBalanceUser2);

    //verify that a swap begun took place
    // const swap = await tradeContract.swaps(0);

    //verify that a swap begun took place

    const firstTrade = await tradeContract.trades(0);
    console.log("first trade", firstTrade);
    const secondTrade = await tradeContract.trades(1);
    console.log("first trade", secondTrade);
    const swap = await tradeContract.swaps(0);
    console.log("swap", swap);

    // Verify that the trades match and a pending action is created
    // const pendingAction = await tradeContract.pendingActions(acc0.address);

    // console.log(await pendingAction);
  }).timeout(600000000000);
});
