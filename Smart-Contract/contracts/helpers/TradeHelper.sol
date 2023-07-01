// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../swaps/SwapERC20.sol";
import "../swaps/SwapERC721.sol";
import "../swaps/CustomSwap.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TradeHelper {
    using SafeMath for uint256;

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
        address counterPartyToken;
        uint256 counterPartyAmount;
        uint256 balance;
        State state;
    }

    struct PendingAction {
        uint256 tradeId;
        uint256 fulfillerTradeId;
        address fulfiller;
        uint256 tokenIndex;
        uint256 swapID;
        uint256 fulfillerAmount;
        uint256 traderAmount;
    }

    struct Fulfillment {
        uint256 amount;
        address payer;
    }

    mapping(uint256 => Trade) public trades; // Mapping for trades
    mapping(address => PendingAction) public pendingActions; // Mapping for pending actions
    mapping(uint256 => Fulfillment) public fulfillments;

    uint256 public tradeCounter;

    event TradeOrderSubmitted(
        uint256 tradeId,
        address initiator,
        address counterParty
    );
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
        uint256 tokenIndex,
        address tokenAddress,
        address recipient,
        uint256 amount
    ) internal {
        TokenType tokenType;

        // Convert the integer tokenType to the corresponding enum value
        if (tokenIndex == 0) {
            tokenType = TokenType.ERC20;
        } else if (tokenIndex == 1) {
            tokenType = TokenType.ERC721;
        } else if (tokenIndex == 2) {
            tokenType = TokenType.CUSTOM;
        } else {
            revert("Invalid token type");
        }

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

        address pairAddress = getPairAddress(tokenIn, tokenOut);
        uint256 scaledAmountOut = (amountIn * exchangeRates[pairAddress]) /
            (10 ** 18);
        return scaledAmountOut;
    }

    function createPendingAction(
        uint256 tradeId,
        uint256 fulfillerTradeId,
        address fulfiller,
        uint256 tokenIndex,
        uint256 swapID,
        uint256 fulfillerAmount,
        uint256 traderAmount
    ) internal {
        PendingAction memory newPendingAction = PendingAction(
            tradeId,
            fulfillerTradeId,
            fulfiller,
            tokenIndex,
            swapID,
            fulfillerAmount,
            traderAmount
        );
        pendingActions[fulfiller] = newPendingAction;
    }

    function findBestMatch(
        uint256 tradeId,
        uint256 counterPartyAmount
    ) internal view returns (uint256, uint256) {
        uint256 highestCoverage;
        uint256 selectedFulfillerIndex;
        uint256 count = 0; // Number of trades with highest coverage
        Trade storage currentTrade = trades[tradeId];

        for (uint256 i = 0; i < tradeCounter; i++) {
            Trade storage trade = trades[i];

            if (
                trade.state != State.FINISHED &&
                currentTrade.initiatorToken == trade.counterPartyToken
            ) {
                // Calculate the coverage as the minimum between counterPartyAmount and trade.balance
                uint256 coverage = counterPartyAmount < trade.balance
                    ? counterPartyAmount
                    : trade.balance;

                if (coverage > highestCoverage) {
                    highestCoverage = coverage;
                    selectedFulfillerIndex = i;
                    count = 1;
                } else if (coverage == highestCoverage) {
                    count++;
                    // Randomly choose between the current selected trade and the new trade with the same coverage
                    if (count == 2) {
                        if (
                            uint256(
                                keccak256(abi.encodePacked(block.timestamp))
                            ) %
                                2 ==
                            0
                        ) {
                            selectedFulfillerIndex = i;
                        }
                    }
                }
            }
        }

        return (highestCoverage, selectedFulfillerIndex);
    }

    function updateTradeStates(
        uint256 newTradeID,
        uint256 existingTradeID,
        uint256 highestCoverage,
        uint256 exchangeRate
    ) internal {
        Trade storage newTrade = trades[newTradeID];
        Trade storage existingTrade = trades[existingTradeID];

        uint256 traderAmountEquivalent = highestCoverage / exchangeRate;

        newTrade.balance = newTrade.balance - traderAmountEquivalent;
        newTrade.state = State.BEGUN;
        existingTrade.state = State.BEGUN;
        existingTrade.balance = existingTrade.balance - highestCoverage;
    }

    // Get the exchange rate between two tokens
    function getExchangeRate(
        address tokenA,
        address tokenB
    ) internal view returns (uint256) {
        return exchangeRates[getPairAddress(tokenA, tokenB)];
    }
}
