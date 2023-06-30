// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./helpers/TradeHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TradeContract is TradeHelper {
    mapping(uint256 => address) public swapContracts; // Mapping for swap contracts

    constructor() {
        // Set the swap contract addresses in the constructor
        swapContracts[0] = address(0xDFE38148EF1115F2f8889A239dEEe1DC781562e1); // erc20
        swapContracts[1] = address(0x0563E89b08953C6eC9A494b6B0acf572A9B76430); // erc721
    }

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

        // Calculate exchange rate
        counterPartyAmount = getAmounts(
            traderToken,
            counterPartyToken,
            traderAmount
        );

        // Find the best match initially
        (
            uint256 highestCoverage,
            uint256 selectedFulfillerIndex
        ) = findBestMatch(
                tradeCounter,
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

        // Perform trade matching and updates
        while (
            highestCoverage > 0 &&
            newTrade.balance > 0 &&
            selectedFulfillerIndex != 0 // Check if there is a valid match
        ) {
            Trade storage existingTrade = trades[selectedFulfillerIndex];
            address selectedFulfiller = existingTrade.initiator;

            // Update the trade states and balances
            updateTradeStates(
                newTrade,
                existingTrade,
                highestCoverage,
                msg.sender,
                swapContracts[0] // Testing with erc20 swap
            );

            emit TradeOrderSubmitted(
                tradeCounter,
                msg.sender,
                selectedFulfiller
            );

            // Find the next best match only if there's a remaining balance
            if (newTrade.balance > 0) {
                (highestCoverage, selectedFulfillerIndex) = findBestMatch(
                    tradeCounter,
                    traderToken,
                    counterPartyToken,
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
        if (newTrade.balance > 0 && selectedFulfillerIndex == 0) {
            newTrade.state = State.PARTIAL;
        }

        tradeCounter++;
        return (newTrade.id, newTrade.counterPartyAmount, newTrade.balance);
    }

    // Complete a swap
    function completeSwap(uint256 pendingActionId) external {
        PendingAction storage pendingAction = pendingActions[pendingActionId];
        Trade storage trade = trades[pendingAction.tradeId];
        Trade storage fulfillerTrade = trades[pendingAction.fulfillerTradeId];
        address swapContractAddress = swapContracts[
            uint256(pendingAction.tokenIndex)
        ];
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
        SwapERC20(swapContractAddress).complete(swapID);

        // Remove completed pending action
        delete pendingActions[pendingActionId];

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

        emit SwapCompleted(pendingAction.tradeId, msg.sender);
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

    // Get the exchange rate between two tokens
    function getExchangeRate(
        address tokenA,
        address tokenB
    ) external view returns (uint256) {
        return exchangeRates[getPairAddress(tokenA, tokenB)];
    }
}
