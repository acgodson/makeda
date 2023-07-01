// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./helpers/TradeHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./swaps/SwapERC20.sol";

contract TradeContract is TradeHelper, SwapERC20 {
    // Submit a trade order
    function submitTradeOrder(
        uint256 tokenIndex,
        address traderToken,
        uint256 traderAmount,
        address counterPartyToken
    ) external returns (uint256) {
        uint256 counterPartyAmount;
        uint256 traderAmountEquivalent;
        require(traderAmount > 0, "Invalid amount");

        // Transfer traderToken to the contract
        if (tokenIndex == 0) {
            require(
                IERC20(traderToken).transferFrom(
                    msg.sender,
                    address(this),
                    traderAmount
                ),
                "ERC20 transfer failed"
            );
        } else if (tokenIndex == 1) {
            // Implement NFT transfer
        } else if (tokenIndex == 2) {
            // Implement custom transfer
        }

        // Get price of counterParty amount based on the rate
        counterPartyAmount = getAmounts(
            traderToken,
            counterPartyToken,
            traderAmount
        );

        // Create a new trade
        Trade memory newTrade = Trade({
            id: tradeCounter,
            initiator: msg.sender,
            initiatorToken: traderToken,
            initiatorAmount: traderAmount,
            counterPartyToken: counterPartyToken,
            counterPartyAmount: counterPartyAmount,
            balance: traderAmount,
            state: State.BEGUN
        });

        trades[newTrade.id] = newTrade;

        // Find the best match after creating the trade
        (
            uint256 highestCoverage,
            uint256 selectedFulfillerIndex
        ) = findBestMatch(newTrade.id, counterPartyAmount);

        // // Perform trade matching and updates
        while (
            highestCoverage > 0 &&
            newTrade.balance > 0 &&
            selectedFulfillerIndex != tradeCounter // Check if there is a valid match
        ) {
            Trade storage existingTrade = trades[selectedFulfillerIndex];

            //get exchange rate from pairaddress, use an oracle in production

            uint256 exchangeRate = getExchangeRate(
                newTrade.initiatorToken,
                newTrade.counterPartyToken
            );
            uint256 traderAmountEquivalent = (highestCoverage * (10 ** 18)) /
                exchangeRate; // Exchange rate with 18 decimal places

            require(traderAmountEquivalent > 0, "invalid amount");

            // //begin a swap
            begin(
                newTrade.initiator,
                existingTrade.initiator,
                newTrade.initiatorToken,
                newTrade.counterPartyToken,
                highestCoverage,
                newTrade.id,
                existingTrade.id,
                traderAmountEquivalent
            );

            // // Update the trade states and balances
            updateTradeStates(newTrade.id, existingTrade.id, highestCoverage);

            //     // Find the next best match only if there's a remaining balance
            if (newTrade.balance > 0) {
                (highestCoverage, selectedFulfillerIndex) = findBestMatch(
                    newTrade.id,
                    traderAmount
                );
                // If there are no more matches, break out of the loop
                if (highestCoverage == 0 || selectedFulfillerIndex == 0) {
                    break;
                }
            } else {
                // If the balance is zero, break out of the loop
                break;
            }
        }

        // // If there's any remaining balance, set trade state to PARTIAL
        if (newTrade.balance > 0) {
            newTrade.state = State.PARTIAL;
        }

        tradeCounter++;
        emit TradeOrderSubmitted(newTrade.id, msg.sender);
        return traderAmountEquivalent;
    }

    // Get Pending swap orders

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

    // Complete a swap order
    function completeSwap(uint256 id) external {
        Swap storage swap = swaps[id];
        Trade storage counterPartyTrade = trades[swap.counterPartyTradeID];
        Trade storage initiatorTrade = trades[swap.initiatorTradeID];

        require(
            swap.counterParty == msg.sender,
            "Only fulfiller can complete the swap"
        );
        require(swap.completed == false, "Trade already completed");

        // For Test, let's work with just ERC20 swap
        complete(id);
        // Update trade states
        if (counterPartyTrade.balance == 0) {
            counterPartyTrade.state = State.FINISHED;
        } else {
            counterPartyTrade.state = State.PARTIAL;
        }
        if (initiatorTrade.balance == 0) {
            initiatorTrade.state = State.FINISHED;
        } else {
            initiatorTrade.state = State.PARTIAL;
        }

        // Update fulfillments
        fulfillments[swap.counterPartyTradeID] = Fulfillment({
            amount: swap.initiatorAmount,
            payer: swap.initiator
        });
        fulfillments[swap.initiatorTradeID] = Fulfillment({
            amount: swap.counterPartyAmount,
            payer: swap.counterParty
        });
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

        //Update balances
        counterPartyTrade.balance =
            counterPartyTrade.balance +
            swap.counterPartyAmount;
        initiatorTrade.balance = initiatorTrade.balance + swap.initiatorAmount;

        // Delete the swap from the mapping
        delete swaps[id];
        emit SwapCancelled(id);
    }

    // Update the exchange rate between two tokens
    function updateExchangeRate(
        address tokenA,
        address tokenB,
        uint256 rate
    ) external {
        setExchangeRate(tokenA, tokenB, rate);
    }
}
