// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./helpers/TradeHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TradeContract is TradeHelper, Ownable {
    mapping(uint256 => address) public swapContracts; // Mapping for swap contracts

    constructor(address erc20SwapAddress, address erc721SwapAddress) {
        swapContracts[uint256(TokenType.ERC20)] = erc20SwapAddress;
        swapContracts[uint256(TokenType.ERC721)] = erc721SwapAddress;
    }

    function submitTradeOrder(
        TokenType tokenType,
        address traderToken,
        uint256 traderAmount,
        address counterPartyToken
    ) external {
        require(traderAmount > 0, "Invalid amount");

        // Transfer traderToken to contract
        transferTokens(tokenType, traderToken, address(this), traderAmount);

        Trade storage newTrade = trades[tradeCounter];

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

        newTrade.id = tradeCounter;
        newTrade.initiator = msg.sender;
        newTrade.initiatorToken = traderToken;
        newTrade.initiatorAmount = traderAmount;
        newTrade.counterPartyToken = counterPartyToken;
        newTrade.counterPartyAmount = 0;
        newTrade.balance = traderAmount;

        // Calculate the counterPartyAmount based on the current exchange rate
        uint256 counterPartyAmount = getAmounts(
            counterPartyToken,
            traderToken,
            traderAmount
        );
        newTrade.counterPartyAmount = counterPartyAmount;

        while (
            highestCoverage > 0 &&
            newTrade.balance > 0 &&
            selectedFulfillerIndex != 0 // Check if there is a valid match
        ) {
            Trade storage existingTrade = trades[selectedFulfillerIndex];

            address selectedFulfiller = existingTrade.initiator; // Assign value to selectedFulfiller

            newTrade.counterParty = selectedFulfiller;
            newTrade.balance -= (traderAmount * highestCoverage) / 100;
            newTrade.state = State.BEGUN;

            existingTrade.balance -=
                (existingTrade.balance * highestCoverage) /
                100;
            existingTrade.fulfillments[msg.sender] = highestCoverage;
            if (existingTrade.state == State.PENDING) {
                existingTrade.balance -=
                    (existingTrade.balance * highestCoverage) /
                    100;
                existingTrade.fulfillments[msg.sender] = highestCoverage;
                existingTrade.state = State.BEGUN;
            } else {
                // Existing trade was in a PARTIAL state, retain the state
                existingTrade.fulfillments[msg.sender] = highestCoverage;
            }

            emit TradeOrderSubmitted(
                tradeCounter,
                msg.sender,
                selectedFulfiller
            );

            // Create pending action for fulfiller
            createPendingAction(
                tradeCounter,
                selectedFulfillerIndex,
                selectedFulfiller,
                tokenType,
                highestCoverage
            );

            // Find the next best match only if there is a remaining balance
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

        // If there is any remaining balance, set trade state to PARTIAL
        if (newTrade.balance > 0 && selectedFulfillerIndex == 0) {
            newTrade.state = State.PARTIAL;
        }

        tradeCounter++;
    }

    function completeSwap(uint256 pendingActionId) external {
        PendingAction storage pendingAction = pendingActions[pendingActionId];
        Trade storage trade = trades[pendingAction.tradeId];
        Trade storage fulfillerTrade = trades[pendingAction.fulfillerTradeId];
        address swapContractAddress = swapContracts[
            uint256(pendingAction.tokenType)
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
        fulfillerTrade.state = State.FINISHED;
        if (trade.balance == 0) {
            trade.state = State.FINISHED;
        }

        emit SwapCompleted(pendingAction.tradeId, msg.sender);
    }

    function updateExchangeRate(
        address tokenA,
        address tokenB,
        uint256 rate
    ) external onlyOwner {
        setExchangeRate(tokenA, tokenB, rate);
    }

    function getExchangeRate(
        address tokenA,
        address tokenB
    ) external view returns (uint256) {
        return exchangeRates[getPairAddress(tokenA, tokenB)];
    }
}
