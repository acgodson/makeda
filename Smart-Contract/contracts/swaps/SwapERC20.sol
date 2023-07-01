// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SwapERC20 {
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

    uint256 public swapCounter;

    event SwapBegun(
        uint256 indexed id,
        address indexed initiator,
        address indexed counterParty
    );
    event SwapCompleted(uint256 indexed id);

    modifier onlyInitiator(uint256 id) {
        require(swaps[id].initiator == msg.sender, "Unauthorized");
        require(!swaps[id].initiated, "Swap already initiated");
        _;
    }

    modifier onlyCounterParty(uint256 id) {
        require(swaps[id].counterParty == msg.sender, "Unauthorized");
        require(swaps[id].initiated, "Swap not initiated");
        require(!swaps[id].completed, "Swap already completed");
        _;
    }

    function begin(
        address initiatorParty,
        address counterParty,
        address initiatorToken,
        address counterPartyToken,
        uint256 highestCoverage,
        uint256 exchangeRate
    ) internal returns (uint256) {
        require(initiatorParty != address(0), "Invalid initiator address");
        require(counterParty != address(0), "Invalid counterParty address");
        require(highestCoverage > 0, "Invalid amount");

        uint256 traderAmountEquivalent = highestCoverage / exchangeRate;

        uint256 id = swapCounter;
        Swap memory swap = Swap({
            id: id,
            initiator: initiatorParty,
            counterParty: counterParty,
            initiatorToken: initiatorToken,
            counterPartyToken: counterPartyToken,
            initiatorAmount: traderAmountEquivalent,
            counterPartyAmount: highestCoverage,
            initiated: true,
            completed: false
        });
        swaps[swapCounter] = swap;

        swapIdsByAddress[initiatorParty].push(id);

        emit SwapBegun(id, initiatorParty, counterParty);
        swapCounter++;
        return id; // Return the trade ID
    }

    function complete(uint256 id) internal onlyCounterParty(id) {
        Swap storage swap = swaps[id];
        IERC20 initiatorToken = IERC20(swap.initiatorToken);
        IERC20 counterPartyToken = IERC20(swap.counterPartyToken);

        uint256 initiatorAmount = swap.initiatorAmount;
        uint256 counterPartyAmount = swap.counterPartyAmount;
        address counterParty = swap.counterParty;
        address initiator = swap.initiator;

        //transfer to fulfiller
        require(
            initiatorToken.transferFrom(
                msg.sender,
                counterParty,
                initiatorAmount
            ),
            "Transfer failed"
        );

        //transfer to initiator
        require(
            counterPartyToken.transferFrom(
                msg.sender,
                initiator,
                counterPartyAmount
            ),
            "Transfer failed"
        );

        swap.completed = true;
        emit SwapCompleted(id);
    }

    function getSwaps(address account) internal view returns (Swap[] memory) {
        uint256[] memory swapIds = swapIdsByAddress[account];
        Swap[] memory userSwaps = new Swap[](swapIds.length);

        for (uint256 i = 0; i < swapIds.length; i++) {
            userSwaps[i] = swaps[swapIds[i]];
        }
        return userSwaps;
    }
}
