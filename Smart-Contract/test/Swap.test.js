// const { expect, assert } = require("chai");
// const { ethers } = require("hardhat");

// describe("Swap contract", function () {
//   let swapContract;
//   let traderToken;
//   let counterPartyToken;
//   let acc0;
//   let acc1;
//   let acc2;

//   beforeEach(async function () {
//     [acc0, acc1, acc2] = await ethers.getSigners();
//     const SwapContract = await ethers.getContractFactory("SwapERC20");

//     swapContract = await SwapContract.deploy();
//     await swapContract.deployed();
//   });

//   it("Should sbegin a swap", async function () {
//     //  existing token contracts
//     traderToken = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276";
//     counterPartyToken = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";

//     console.log("TradeContract deployed at:", swapContract.address);

//     console.log("submitting transaction");
//     console.log("traderToken address", traderToken);
//     console.log("counterPartyToken address", counterPartyToken);

//     const transferAmount = ethers.utils.parseEther("5");
//     // Begin the swap and retrieve the swap ID
//     const swapTx = await swapContract
//       .connect(acc0)
//       .begin(
//         acc2.address,
//         acc0.address,
//         traderToken,
//         counterPartyToken,
//         transferAmount,
//         transferAmount
//       );

//     swapTx.wait();

//     const newSwap = await swapContract.swaps(0);
//     console.log("swap has initiated", newSwap);
//   }).timeout(60000000000);
// });
