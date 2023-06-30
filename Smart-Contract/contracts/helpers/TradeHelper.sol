// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../swaps/SwapERC20.sol";
import "../swaps/SwapERC721.sol";
import "../swaps/CustomSwap.sol";

contract TradeHelper {
    enum TokenType {
        ERC20,
        ERC721,
        CUSTOM
    }

    enum State {
        PENDING,
        BEGUN,
        PARTIAL,
        FINISHED
    }

    struct Trade {
        uint256 id;
        address initiator;
        address initiatorToken;
        uint256 initiatorAmount;
        address counterParty;
        address counterPartyToken;
        uint256 counterPartyAmount;
        uint256 balance;
        mapping(address => uint256) fulfillments;
        State state;
    }

    struct PendingAction {
        uint256 tradeId;
        uint256 fulfillerTradeId;
        address fulfiller;
        TokenType tokenType;
        uint256 swapID;
    }

    mapping(uint256 => Trade) public trades; // Mapping for trades
    mapping(uint256 => PendingAction) public pendingActions; // Mapping for pending actions

    uint256 public tradeCounter;

    event TradeOrderSubmitted(
        uint256 tradeId,
        address initiator,
        address counterParty
    );
    event SwapCompleted(uint256 tradeId, address fulfiller);

    mapping(address => uint256) public exchangeRates; // Mapping for exchange rates

    function setExchangeRate(
        address tokenA,
        address tokenB,
        uint256 rate
    ) internal {
        require(rate > 0, "Exchange rate must be greater than zero");
        require(tokenA != address(0), "Invalid token A address");
        require(tokenB != address(0), "Invalid token B address");

        address pairAddress = getPairAddress(tokenA, tokenB);
        require(pairAddress != address(0), "Invalid token pair");

        exchangeRates[pairAddress] = rate;
    }

    function transferTokens(
        TokenType tokenType,
        address tokenAddress,
        address recipient,
        uint256 amount
    ) internal {
        if (tokenType == TokenType.ERC20) {
            require(
                IERC20(tokenAddress).transfer(recipient, amount),
                "ERC20 transfer failed"
            );
        } else if (tokenType == TokenType.ERC721) {
            // Implement NFT transfer
        } else if (tokenType == TokenType.CUSTOM) {
            // Implement custom transfer
            // Add the appropriate transfer logic here
        }
    }

    function getPairAddress(
        address tokenA,
        address tokenB
    ) internal pure returns (address) {
        return
            address(
                uint160(uint256(keccak256(abi.encodePacked(tokenA, tokenB))))
            ); // Create deterministic pair address
    }

    function getAmounts(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        require(amountIn > 0, "Invalid amount");

        if (exchangeRates[tokenIn] == 0 || exchangeRates[tokenOut] == 0) {
            revert("Invalid token pair");
        }

        // Adjust the calculation by scaling the exchange rate
        uint256 scaledAmountOut = (amountIn * exchangeRates[tokenIn]) /
            (10 ** 18);

        return scaledAmountOut;
    }

    function createPendingAction(
        uint256 tradeId,
        uint256 fulfillerTradeId,
        address fulfiller,
        TokenType tokenType,
        uint256 swapID
    ) internal {
        pendingActions[tradeId] = PendingAction(
            tradeId,
            fulfillerTradeId,
            fulfiller,
            tokenType,
            swapID
        );
    }

    function findBestMatch(
        uint256 tradeId,
        address traderToken,
        address counterPartyToken,
        uint256 traderAmount
    ) internal view returns (uint256, uint256) {
        uint256 highestCoverage = 0;
        uint256 selectedFulfillerIndex = 0;

        for (uint256 i = 1; i <= tradeCounter; i++) {
            // Skip the current trade
            if (i == tradeId) {
                continue;
            }

            Trade storage trade = trades[i];

            if (
                trade.state != State.PENDING || // Only consider pending trades
                trade.initiatorToken != counterPartyToken || // Check token types
                trade.counterPartyToken != traderToken || // Check token types
                trade.counterPartyAmount == 0 || // Ensure counterPartyAmount is non-zero
                traderAmount == 0 // Ensure traderAmount is non-zero
            ) {
                continue;
            }

            uint256 coverage = (traderAmount * 100) / trade.counterPartyAmount;

            if (coverage > highestCoverage && coverage <= 100) {
                highestCoverage = coverage;
                selectedFulfillerIndex = i;
            }
        }

        return (highestCoverage, selectedFulfillerIndex);
    }

    function updateTradeStates(
        Trade storage newTrade,
        Trade storage existingTrade,
        uint256 highestCoverage,
        address sender,
        address erc20SwapAddress
    ) internal {
        newTrade.counterParty = existingTrade.initiator;
        newTrade.balance -= (newTrade.initiatorAmount * highestCoverage) / 100;
        newTrade.state = State.BEGUN;

        existingTrade.balance -=
            (existingTrade.balance * highestCoverage) /
            100;
        existingTrade.fulfillments[sender] = highestCoverage;

        if (existingTrade.state == State.PENDING) {
            existingTrade.balance -=
                (existingTrade.balance * highestCoverage) /
                100;
            existingTrade.fulfillments[sender] = highestCoverage;
            existingTrade.state = State.BEGUN;
        } else {
            // Existing trade was in a PARTIAL state, retain the state
            existingTrade.fulfillments[sender] = highestCoverage;
        }

        // Begin the swap and retrieve the swap ID
        uint256 swapID = SwapERC20(erc20SwapAddress).begin(
            newTrade.initiator,
            newTrade.counterParty,
            newTrade.initiatorToken,
            newTrade.counterPartyToken,
            (newTrade.initiatorAmount * highestCoverage) / 100,
            (newTrade.counterPartyAmount * highestCoverage) / 100
        );

        // Create pending action with the retrieved swap ID
        createPendingAction(
            newTrade.id,
            existingTrade.id,
            sender,
            TokenType.ERC20,
            swapID
        );
    }
}
