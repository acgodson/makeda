const { expect } = require("chai");

describe("TradeContract", function () {
  let tradeContract;
  let traderToken;
  let counterPartyToken;
  let alice;
  let bob;
  let john;

  beforeEach(async function () {
    // Deploy the SwapContracts
    const ERC20SwapContract = await ethers.getContractFactory(
      "swaps/SwapERC20"
    );
    const erc20SwapContract = await ERC20SwapContract.deploy();
    const ERC721SwapContract = await ethers.getContractFactory(
      "swaps/SwapERC721"
    );
    const erc721SwapContract = await ERC721SwapContract.deploy();

    // Get the swap contract addresses
    const erc20SwapAddress = erc20SwapContract.address;
    const erc721SwapAddress = erc721SwapContract.address;

    // Deploy the TradeContract with swap addresses
    const TradeContract = await ethers.getContractFactory("TradeContract");
    const tradeContract = await TradeContract.deploy(
      erc20SwapAddress,
      erc721SwapAddress
    );

    // Deploy ERC20 tokens for testing
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    traderToken = await ERC20Token.deploy("Trader Token", "TRD");
    counterPartyToken = await ERC20Token.deploy("CounterParty Token", "CPT");

    // Deploy mock traders
    [alice, bob, john] = await ethers.getSigners();
  });

  it("should submit trade order and update trade details correctly", async function () {
    // Approve the trade contract to spend trader tokens
    const traderAmount = ethers.utils.parseEther("10");
    await traderToken.approve(tradeContract.address, traderAmount);

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
    expect(aliceTrade.counterParty).to.equal(address(0));
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
  });

  it("should match trades and update trade details correctly", async function () {
    // ... (continue from previous it() block)

    const aliceTrade = await tradeContract.trades(0);
    const bobTrade = await tradeContract.trades(1);

    // John submits a trade order with the same amount as Alice's remaining balance
    await tradeContract.connect(john).submitTradeOrder(
      0, // TokenType.ERC20
      traderToken.address,
      traderAmount.div(2),
      counterPartyToken.address
    );

    const johnTrade = await tradeContract.trades(2);

    // Check if the trades are matched correctly
    expect(aliceTrade.counterParty).to.equal(john.address);
    expect(aliceTrade.counterPartyAmount).to.equal(traderAmount.div(2));
    expect(aliceTrade.balance).to.equal(traderAmount.div(2));
    expect(aliceTrade.state).to.equal(1); // State.BEGUN

    expect(bobTrade.counterParty).to.equal(alice.address);
    expect(bobTrade.counterPartyAmount).to.equal(traderAmount.div(2));
    expect(bobTrade.balance).to.equal(0);
    expect(bobTrade.state).to.equal(1); // State.BEGUN

    expect(johnTrade.counterParty).to.equal(alice.address);
    expect(johnTrade.counterPartyAmount).to.equal(traderAmount.div(2));
    expect(johnTrade.balance).to.equal(0);
    expect(johnTrade.state).to.equal(1); // State.BEGUN
  });

  it("should complete the trades and update trade details correctly", async function () {
    // ... (continue from previous it() block)

    const aliceTrade = await tradeContract.trades(0);
    const bobTrade = await tradeContract.trades(1);
    const johnTrade = await tradeContract.trades(2);

    // Alice completes the swap for the first trade
    await tradeContract.completeSwap(0);

    // Check if the trade details are updated correctly
    expect(aliceTrade.state).to.equal(3); // State.FINISHED
    expect(bobTrade.state).to.equal(1); // State.BEGUN
    expect(johnTrade.state).to.equal(1); // State.BEGUN

    // Bob completes the swap for his trade
    await tradeContract.connect(bob).completeSwap(1);

    // Check if the trade details are updated correctly
    expect(aliceTrade.state).to.equal(3); // State.FINISHED
    expect(bobTrade.state).to.equal(3); // State.FINISHED
    expect(johnTrade.state).to.equal(1); // State.BEGUN

    // John completes the swap for his trade
    await tradeContract.connect(john).completeSwap(2);

    // Check if the trade details are updated correctly
    expect(aliceTrade.state).to.equal(3); // State.FINISHED
    expect(bobTrade.state).to.equal(3); // State.FINISHED
    expect(johnTrade.state).to.equal(3); // State.FINISHED
  });
});
