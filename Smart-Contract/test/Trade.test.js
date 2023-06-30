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

  it("Should submit trade order", async function () {
    //  existing token contracts
    traderToken = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276";
    counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

    console.log("TradeContract deployed at:", tradeContract.address);

    console.log("submitting");
    console.log("traderToken address", traderToken);
    console.log("counterPartyToken address", counterPartyToken);

    const rate = ethers.utils.parseUnits(String(30516 / 1852.4), 18);
    const allowance = ethers.utils.parseUnits("300", 18);
    const transferAmount = ethers.utils.parseEther("5");
    const TokenContract = await ethers.getContractAt("IERC20", traderToken);

    await TokenContract.connect(acc0).approve(
      tradeContract.address,
      allowance,
      { gasLimit: 500000 }
    );

    const initialBalance = await TokenContract.balanceOf(acc0.address);

    // // update exchange rate
    await tradeContract.updateExchangeRate(
      traderToken,
      counterPartyToken,
      rate
    );

    // Call the submitTradeOrder function
    const submitTx = await tradeContract
      .connect(acc0)
      .submitTradeOrder(0, traderToken, transferAmount, counterPartyToken, {
        gasLimit: 500000,
      });

    const submitTxReceipt = await submitTx.wait();

    // Get the emitted events

    const tradeID = submitTxReceipt.events[0].data;
    const trade = tradeContract.trades(0);
    console.log(await trade);

    const finalBalance = await TokenContract.balanceOf(acc0.address);
    const expectedFinalBalance = initialBalance.sub(transferAmount);
    // Assert that the final balance is equal to the expected final balance
    expect(finalBalance).to.equal(expectedFinalBalance);
  }).timeout(600000000000);
});
