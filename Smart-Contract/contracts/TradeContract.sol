// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./helpers/TradeHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./swaps/SwapERC20.sol";

contract TradeContract is TradeHelper, SwapERC20 {
    // struct Match {
    //     address user;
    //     uint256 coverage;
    // }

    // mapping(uint256 => Match) public matches;
    uint256 public matchCounter;

    // Submit a trade order
    function submitTradeOrder(
        uint256 tokenIndex,
        address traderToken,
        uint256 traderAmount,
        address counterPartyToken
    )
        external
        returns (uint256 id, uint256 counterPartyAmount, uint256 balance)
    {
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

        //get exchange rate from pairaddress, use an oracle in production
        uint256 exchangeRate = getExchangeRate(traderToken, counterPartyToken);

        // Get price of counterParty amount based on the rate
        counterPartyAmount = getAmounts(
            traderToken,
            counterPartyToken,
            traderAmount
        );
        require(counterPartyAmount > 0, "unable to calculate exchange amount");

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
            address selectedFulfiller = existingTrade.initiator;

            // Update the trade states and balances
            updateTradeStates(
                newTrade.id,
                existingTrade.id,
                highestCoverage,
                exchangeRate
            );

            uint256 newSwapID = begin(
                newTrade.initiator,
                existingTrade.initiator,
                newTrade.initiatorToken,
                newTrade.counterPartyToken,
                highestCoverage,
                exchangeRate
            );

            // Create pending action with the retrieved swap ID (erc20)
            createPendingAction(
                newTrade.id,
                existingTrade.id,
                msg.sender,
                0,
                newSwapID,
                highestCoverage,
                highestCoverage
            );

            emit TradeOrderSubmitted(
                tradeCounter,
                msg.sender,
                selectedFulfiller
            );

            // Find the next best match only if there's a remaining balance
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

        // If there's any remaining balance, set trade state to PARTIAL
        if (newTrade.balance > 0) {
            newTrade.state = State.PARTIAL;
        }

        tradeCounter++;
        return (newTrade.id, newTrade.counterPartyAmount, newTrade.balance);
    }

    // Complete a swap
    function completeSwap(address fulfiller) external {
        PendingAction storage pendingAction = pendingActions[fulfiller];
        Trade storage trade = trades[pendingAction.tradeId];
        Trade storage fulfillerTrade = trades[pendingAction.fulfillerTradeId];

        require(
            pendingAction.fulfiller == msg.sender,
            "Only fulfiller can complete the swap"
        );
        require(
            trade.state != State.FINISHED &&
                fulfillerTrade.state != State.FINISHED,
            "Trade already completed"
        );

        // For Test, let's work with just ERC20 swap
        uint256 swapID = pendingAction.swapID;
        complete(swapID);

        // Remove completed pending action
        delete pendingActions[fulfiller];

        // Update trade states
        if (fulfillerTrade.balance == 0) {
            fulfillerTrade.state = State.FINISHED;
        }
        if (trade.balance == 0) {
            trade.state = State.FINISHED;
        }

        // Update fulfillments
        fulfillments[fulfillerTrade.id] = Fulfillment({
            amount: pendingAction.traderAmount,
            payer: trade.initiator
        });
        fulfillments[trade.id] = Fulfillment({
            amount: pendingAction.fulfillerAmount,
            payer: fulfillerTrade.initiator
        });
    }

    // Get the counterparty amount for a given trade
    function getCounterPartyAmount(
        address traderToken,
        address counterPartyToken,
        uint256 traderAmount
    ) external view returns (uint256) {
        return getAmounts(traderToken, counterPartyToken, traderAmount);
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
