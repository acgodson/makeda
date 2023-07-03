const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Makeda Contract", function () {
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
    console.log("smart contract deployed at", tradeContract.address);
  });

  it("Should match and complete trade", async function () {
    traderToken = "0x6DA84c226162aBf933c18b5Ca6bC3577584bee86";
    counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

    const transferAmount = ethers.utils.parseEther("3");
    const transferAmountUser2 = ethers.utils.parseEther("3");

    //User one gives allowance and submits trade
    const allowance = ethers.utils.parseUnits("100", 18);
    const TokenContract = await ethers.getContractAt("IERC20", traderToken);
    await TokenContract.connect(acc0).approve(
      tradeContract.address,
      allowance,
      { gasLimit: 500000 }
    );

    const submitTx = await tradeContract
      .connect(acc0)
      .submitTradeOrder(traderToken, transferAmount, counterPartyToken, {
        gasLimit: 5000000,
      });

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
      allowance,
      { gasLimit: 500000 }
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
