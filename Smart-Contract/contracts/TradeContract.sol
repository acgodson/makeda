// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TradeHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TradeContract is TradeHelper {
    mapping(uint256 => address) public swapContracts; // Mapping for swap contracts

    Counters.Counter private instanceId;

    struct Swap {
        uint256 id;
        address initiator;
        address counterParty;
        address initiatorToken;
        address counterPartyToken;
        uint256 initiatorAmount;
        uint256 counterPartyAmount;
        bool initiated;
        bool completed;
    }

    mapping(uint256 => Swap) public swaps;
    mapping(address => uint256[]) private swapIdsByAddress;

    event SwapBegun(
        uint256 indexed id,
        address indexed initiator,
        address indexed counterParty,
        address initiatorToken,
        address counterPartyToken,
        uint256 initiatorAmount,
        uint256 counterPartyAmount
    );
    event SwapCompleted(uint256 indexed id);

    modifier onlyCounterParty(uint256 id) {
        require(swaps[id].counterParty == msg.sender, "Unauthorized");
        require(swaps[id].initiated, "Swap not initiated");
        require(!swaps[id].completed, "Swap already completed");
        _;
    }

    function submitTradeOrder(
        TokenType tokenType,
        address traderToken,
        uint256 traderAmount,
        address counterPartyToken
    ) external {
        require(traderAmount > 0, "Invalid amount");

        // Add a revert statement to check if a valid token type was given
        require(
            tokenType == TokenType.ERC20 ||
                tokenType == TokenType.ERC721 ||
                tokenType == TokenType.CUSTOM,
            "Invalid token type"
        );

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
            address selectedFulfiller = existingTrade.initiator;

            // Update the trade states and balances
            updateTradeStates(
                newTrade,
                existingTrade,
                highestCoverage,
                msg.sender,
                swapContracts[uint256(TokenType.ERC20)] //we are testing with erc20 swap, in production use if to find token type and appropraite address
            );

            emit TradeOrderSubmitted(
                tradeCounter,
                msg.sender,
                selectedFulfiller
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

    function getCounterPartyAmount(
        address traderToken,
        address counterPartyToken,
        uint256 traderAmount
    ) external view returns (uint256) {
        return getAmounts(traderToken, counterPartyToken, traderAmount);
    }

    function updateExchangeRate(
        address tokenA,
        address tokenB,
        uint256 rate
    ) external {
        setExchangeRate(tokenA, tokenB, rate);
    }

    function getExchangeRate(
        address tokenA,
        address tokenB
    ) external view returns (uint256) {
        return exchangeRates[getPairAddress(tokenA, tokenB)];
    }
}
