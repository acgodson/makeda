const { expect } = require("chai");

describe("TradeContract", function () {
  let tradeContract;
  let traderToken;
  let counterPartyToken;
  let alice;
  let bob;
  let john;
  let m_USDC;
  let m_BTC;
  let m_ETH;
  let m_NFT;

  beforeEach(async function () {
    //mock traders
    [alice, bob, john] = await ethers.getSigners();

    // Helper contract addresses
    m_USDC = "0x6DA84c226162aBf933c18b5Ca6bC3577584bee86";
    m_BTC = "0x37bEcc8ed3EaFB5b8db58EDb4ee11494181a0276";
    m_ETH = "0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4";
    m_NFT = "0x4ce12d9a1C69B32C69f79Fa94A5700308D5F6782";
    swapERC20Address = "0xDFE38148EF1115F2f8889A239dEEe1DC781562e1";
    swapERC721Address = "0x0563E89b08953C6eC9A494b6B0acf572A9B76430";

    //select two tokens for test
    counterPartyToken = m_BTC;
    traderToken = m_ETH;

    // Deploy the TradeContract with helper contract addresses
    const TradeContractFactory = await ethers.getContractFactory(
      "TradeContract"
    );

    tradeContract = await TradeContractFactory.deploy(
      swapERC20Address,
      swapERC721Address
    );
    await tradeContract.deployed();
  });

  it("should submit trade order and update trade details correctly", async function () {
    // Approve the trade contract to spend trader tokens
    const traderAmount = ethers.utils.parseEther("10");
    await traderToken.approve(tradeContract.address, traderAmount);

    // Check Bob's token balance
    const bobBalance = await counterPartyToken.balanceOf(bob.address);
    console.log(bobBalance.toString()); // Print Bob's token balance

    return;

    // Alice submits a trade order
    await tradeContract.submitTradeOrder(
      0, // TokenType.ERC20
      traderToken.address,
      traderAmount,
      counterPartyToken.address
    );

    const aliceTrade = await tradeContract.trades(0);
    expect(aliceTrade.initiator).to.equal(alice.address);
    expect(aliceTrade.initiatorToken).to.equal(traderToken.address);
    expect(aliceTrade.initiatorAmount).to.equal(traderAmount);
    expect(aliceTrade.counterParty).to.equal(ethers.constants.AddressZero);
    expect(aliceTrade.counterPartyToken).to.equal(counterPartyToken.address);
    expect(aliceTrade.counterPartyAmount).to.equal(0);
    expect(aliceTrade.balance).to.equal(traderAmount);
    expect(aliceTrade.state).to.equal(0); // State.PENDING

    // Bob submits a trade order
    await tradeContract.connect(bob).submitTradeOrder(
      0, // TokenType.ERC20
      counterPartyToken.address,
      traderAmount.div(2), // Bob's trade amount is half of Alice's
      traderToken.address
    );

    const bobTrade = await tradeContract.trades(1);
    expect(bobTrade.initiator).to.equal(bob.address);
    expect(bobTrade.initiatorToken).to.equal(counterPartyToken.address);
    expect(bobTrade.initiatorAmount).to.equal(traderAmount.div(2));
    expect(bobTrade.counterParty).to.equal(alice.address);
    expect(bobTrade.counterPartyToken).to.equal(traderToken.address);
    expect(bobTrade.counterPartyAmount).to.equal(0);
    expect(bobTrade.balance).to.equal(0);
    expect(bobTrade.state).to.equal(0); // State.PENDING
  }).timeout(600000000000);

  // it("should match trades and update trade details correctly", async function () {
  //   // ... (continue from previous it() block)

  //   const aliceTrade = await tradeContract.trades(0);
  //   const bobTrade = await tradeContract.trades(1);

  //   // John submits a trade order with the same amount as Alice's remaining balance
  //   await tradeContract.connect(john).submitTradeOrder(
  //     0, // TokenType.ERC20
  //     traderToken.address,
  //     traderAmount.div(2),
  //     counterPartyToken.address
  //   );

  //   const johnTrade = await tradeContract.trades(2);

  //   // Check if the trades are matched correctly
  //   expect(aliceTrade.counterParty).to.equal(john.address);
  //   expect(aliceTrade.counterPartyAmount).to.equal(traderAmount.div(2));
  //   expect(aliceTrade.balance).to.equal(traderAmount.div(2));
  //   expect(aliceTrade.state).to.equal(1); // State.BEGUN

  //   expect(bobTrade.counterParty).to.equal(alice.address);
  //   expect(bobTrade.counterPartyAmount).to.equal(traderAmount.div(2));
  //   expect(bobTrade.balance).to.equal(0);
  //   expect(bobTrade.state).to.equal(1); // State.BEGUN

  //   expect(johnTrade.counterParty).to.equal(alice.address);
  //   expect(johnTrade.counterPartyAmount).to.equal(traderAmount.div(2));
  //   expect(johnTrade.balance).to.equal(0);
  //   expect(johnTrade.state).to.equal(1); // State.BEGUN
  // });

  // it("should complete the trades and update trade details correctly", async function () {
  //   // ... (continue from previous it() block)

  //   const aliceTrade = await tradeContract.trades(0);
  //   const bobTrade = await tradeContract.trades(1);
  //   const johnTrade = await tradeContract.trades(2);

  //   // Alice completes the swap for the first trade
  //   await tradeContract.completeSwap(0);

  //   // Check if the trade details are updated correctly
  //   expect(aliceTrade.state).to.equal(3); // State.FINISHED
  //   expect(bobTrade.state).to.equal(1); // State.BEGUN
  //   expect(johnTrade.state).to.equal(1); // State.BEGUN

  //   // Bob completes the swap for his trade
  //   await tradeContract.connect(bob).completeSwap(1);

  //   // Check if the trade details are updated correctly
  //   expect(aliceTrade.state).to.equal(3); // State.FINISHED
  //   expect(bobTrade.state).to.equal(3); // State.FINISHED
  //   expect(johnTrade.state).to.equal(1); // State.BEGUN

  //   // John completes the swap for his trade
  //   await tradeContract.connect(john).completeSwap(2);

  //   // Check if the trade details are updated correctly
  //   expect(aliceTrade.state).to.equal(3); // State.FINISHED
  //   expect(bobTrade.state).to.equal(3); // State.FINISHED
  //   expect(johnTrade.state).to.equal(3); // State.FINISHED
  // });
});
