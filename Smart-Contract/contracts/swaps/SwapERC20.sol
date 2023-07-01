// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SwapERC20 {
    struct Swap {
        uint256 id;
        uint256 initiatorTradeID;
        uint256 counterPartyTradeID;
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
    mapping(address => uint256[]) public swapIdsByAddress;

    uint256 public swapCounter;

    event SwapBegun(
        uint256 indexed id,
        address indexed initiator,
        address indexed counterParty
    );
    event SwapCompleted(uint256 indexed id);
    event SwapCancelled(uint256 indexed id);

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
        uint256 initiatorTradeID,
        uint256 counterPartyTradeID,
        uint256 traderAmountEquivalent
    ) internal {

        uint256 id = swapCounter;

        //get exchange rate from pairaddress, use an oracle in production
       
        Swap memory swap = Swap({
            id: id,
            initiatorTradeID: initiatorTradeID,
            counterPartyTradeID: counterPartyTradeID,
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

        swapIdsByAddress[counterParty].push(id);
        swapIdsByAddress[counterParty].push(id);

        emit SwapBegun(id, initiatorParty, counterParty);
        swapCounter++;
    }

    function complete(uint256 id) internal onlyCounterParty(id) {
        Swap storage swap = swaps[id];
        IERC20 initiatorToken = IERC20(swap.initiatorToken);
        IERC20 counterPartyToken = IERC20(swap.counterPartyToken);

        uint256 initiatorAmount = swap.initiatorAmount;
        uint256 counterPartyAmount = swap.counterPartyAmount;
        address counterParty = swap.counterParty;
        address initiator = swap.initiator;

        // transfer to fulfiller
        require(
            initiatorToken.transferFrom(
                address(this),
                counterParty,
                initiatorAmount
            ),
            "Transfer to counterParty failed"
        );

        require(
            initiatorToken.transferFrom(
                address(this),
                counterParty,
                initiatorAmount
            ),
            "Transfer to initiator failed"
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
