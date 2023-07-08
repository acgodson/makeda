![Makeda Logo](Snapshots/makedaBanner.png)

# Makeda

<!-- 👉 [Video Demo]() -->

## Description

### The Makeda contract facilitates peer-2-peer trading of ERC20 tokens using a priority-based matching system for automated trade execution (ATE).

<br/>
Users submit trade orders, which are then matched with existing orders based on their priority level. The contract supports both partial and complete trades, enabling users to specify the desired quantity of tokens for each trade.

## Features

- Peer-to-peer approval
- Order size Priority matching
- Time Priority matching
- Price Priority matching

## Requirements

HardHat and Nodejs Installed

```bash

git clone "https://github,com/acgodson/makeda"
cd Smart-Contract
npm install
```

Test Contract

```bash
npx hardhat test
```
Deploy a new TradeContract
```bash
npx hardhat run scripts/deployContract.js
```

Initialize your custom tokens
```typescript
const tokens sting[] = <addresses>;
const prices sting[] = <addresses>;
...
 await tradeCcontract.initialize(tokens, prices, {gasLimit: 500000});
```

<!-- Replace the image URLs below with the actual links to your project screenshots -->

![Test Contract](Snapshots/hardhat.png)
![UI](Snapshots/Screenshot%202023-06-29%20at%2014.03.58.png)

## Smart Contract

The Solidity smart contract allows users to `submit trade orders`, `perform swaps`, and `cancel swaps`.

- **submitTradeOrder**: Transfers the trader's tokens to the escrow contract, calculates the counterparty amount based on the token prices, creates a new trade, and tries to find exisitng match for the trade. 

- **getPendingSwaps**: Returns an array swaps pending fulfillment for a given user.

- **completeSwap**: Allows the counterparty approve a swap. It marks the swap as completed, updates the trade states, and records the fulfillments.

- **cancelSwap**: Allows the initiator or counterparty to cancel a swap, returns locked tokens to the respective parties, updates the trade balances, and deletes a the swap record.

- **updateTokenPrice**: Allows contract owner  to upate current prices of tokens, (this can be fetch from an oracle in production).

In Summary, the Makeda Trade Contract provides a basic framework for submitting P2P trade orders and performing swaps between tokens, and can be modified to fit different use cases such _DEX, aunction platorms etc_

