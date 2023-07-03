// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./helpers/PriorityQueue.sol";
import "./helpers/TradeHelper.sol";
import "./swaps/SwapERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract TradeContract is TradeHelper, Initializable {
    // constructor() {
    //hardcorded for demo
    // tokenPrices[
    //     address(0xe7dCfABAFBe09D7D9081E44de4Ad7203f88BF28F)
    // ] = 30516;
    // tokenPrices[address(0xd85b13920b03d6998700cf52f0F2cdF702f0896E)] = 1852;
    // tokenPrices[
    //     address(0x6DA84c226162aBf933c18b5Ca6bC3577584bee86)
    // ] = 30516;
    // tokenPrices[address(0xcC8A7e1C88596Cf4e7073343100a4A1fD0eaC8C4)] = 1852;
    // }

    function initialize(
        address[] memory _tokens,
        uint256[] memory _prices
    ) public initializer {
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];
            uint256 price = _prices[i];
            require(token != address(0), "Invalid token address");
            require(price > 0, "Invalid price");

            tokenPrices[token] = price;
        }
        tradeCounter = 1;
    }

    function submitTradeOrder(
        address initiatorToken,
        uint256 initiatorAmount,
        address counterPartyToken
    ) external returns (Trade memory) {
        require(initiatorAmount > 0, "Invalid initiator amount");

        // lock deposit in escrow contract
        require(
            IERC20(initiatorToken).transferFrom(
                msg.sender,
                address(this),
                initiatorAmount
            ),
            "ERC20 transfer failed"
        );

        // Calculate the priority based on counterPartyAmount
        uint256 priority = calculatePriority(
            initiatorAmount,
            counterPartyToken,
            initiatorToken
        );

        // Create a new trade
        Trade memory newTrade = Trade({
            id: tradeCounter,
            initiator: msg.sender,
            initiatorAmount: initiatorAmount,
            initiatorToken: initiatorToken,
            counterPartyToken: counterPartyToken,
            counterPartyAmount: priority,
            balance: initiatorAmount,
            state: State.BEGUN,
            timestamp: block.timestamp
        });

        trades[newTrade.id] = newTrade;

        // Add trade to the priority index
        bytes32 pairHash = getPairHash(initiatorToken, counterPartyToken);
        enqueue(newTrade.id, priority, pairHash);

        // Find the best match
        (uint256 bestMatchId, uint256 availableAmount) = findBestMatch(
            newTrade.id
        );

        // Perform trade matching and updates
        if (bestMatchId != 0) {
            Trade storage existingTrade = trades[bestMatchId];

            // Match found, perform the trade
            performTrade(newTrade.id, existingTrade.id, availableAmount);

            // Return the existing trade struct
            return existingTrade;
        }

        tradeCounter++;
        return newTrade; // No match found
    }

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function updateTokenPrice(address token, uint256 price) external {
        tokenPrices[token] = price;
    }

    function completeSwap(uint256 id) external {
        Swap storage swap = swaps[id];
        Trade storage counterPartyTrade = trades[swap.counterPartyTradeID];
        Trade storage initiatorTrade = trades[swap.initiatorTradeID];

        require(
            swap.counterParty == msg.sender,
            "Only fulfiller can complete the swap"
        );
        require(swap.completed != true, "Trade already completed");

        // For Test, let's work with just ERC20 swap
        complete(swap.id);

        // Update trade states
        if (counterPartyTrade.balance == 0) {
            counterPartyTrade.state = State.COMPLETED;
        }
        if (initiatorTrade.balance == 0) {
            initiatorTrade.state = State.COMPLETED;
        }

        // Update fulfillments
        Fulfillment memory forFulfiller = Fulfillment({
            amount: swap.initiatorAmount,
            payer: swap.initiator
        });

        Fulfillment memory forIntiiator = Fulfillment({
            amount: swap.counterPartyAmount,
            payer: swap.counterParty
        });
        fulfillments[swap.counterPartyTradeID].push(forFulfiller);
        fulfillments[swap.initiatorTradeID].push(forIntiiator);
    }

    function getPendingSwaps() external view returns (Swap[] memory) {
        uint256[] memory swapIds = swapIdsByAddress[msg.sender];
        uint256 pendingSwapCount = 0;

        // Count the number of pending swaps
        for (uint256 i = 0; i < swapIds.length; i++) {
            uint256 id = swapIds[i];
            if (
                swaps[id].counterParty == msg.sender &&
                swaps[id].initiated &&
                !swaps[id].completed
            ) {
                pendingSwapCount++;
            }
        }

        // Initialize the array of pending swaps
        Swap[] memory pendingSwaps = new Swap[](pendingSwapCount);
        uint256 index = 0;

        // Retrieve the pending swaps
        for (uint256 i = 0; i < swapIds.length; i++) {
            uint256 id = swapIds[i];
            if (
                swaps[id].counterParty == msg.sender &&
                swaps[id].initiated &&
                !swaps[id].completed
            ) {
                pendingSwaps[index] = swaps[id];
                index++;
            }
        }

        return pendingSwaps;
    }

    function cancelSwap(uint256 id) external {
        Swap storage swap = swaps[id];
        Trade storage counterPartyTrade = trades[swap.counterPartyTradeID];
        Trade storage initiatorTrade = trades[swap.initiatorTradeID];

        require(
            swap.initiator == msg.sender || swap.counterParty == msg.sender,
            "Only initiator or counterParty can cancel the swap"
        );
        require(swap.completed == false, "Swap already completed");

        IERC20 initiatorToken = IERC20(swap.initiatorToken);
        IERC20 counterPartyToken = IERC20(swap.counterPartyToken);

        uint256 initiatorAmount = swap.initiatorAmount;
        uint256 counterPartyAmount = swap.counterPartyAmount;
        address counterParty = swap.counterParty;
        address initiator = swap.initiator;

        // Transfer tokens from the contract to the initiator
        require(
            initiatorToken.transferFrom(
                address(this),
                initiator,
                initiatorAmount
            ),
            "Transfer failed"
        );

        // Transfer tokens from the contract to the counterParty
        require(
            counterPartyToken.transferFrom(
                address(this),
                counterParty,
                counterPartyAmount
            ),
            "Transfer failed"
        );

        // Update balances
        counterPartyTrade.balance += counterPartyAmount;
        initiatorTrade.balance += initiatorAmount;

        // Delete the swap from the mapping
        delete swaps[id];
        emit SwapCancelled(id);
    }
}
