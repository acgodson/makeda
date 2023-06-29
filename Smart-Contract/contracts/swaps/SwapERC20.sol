// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SwapERC20 is Ownable, Pausable {
    using Counters for Counters.Counter;

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
        uint256 initiatorAmount,
        uint256 counterPartyAmount
    ) external whenNotPaused returns (uint256) {
        require(initiatorParty != address(0), "Invalid initiator address");
        require(counterParty != address(0), "Invalid counterParty address");
        require(initiatorAmount > 0, "Invalid amount");

        instanceId.increment();
        uint256 id = instanceId.current();
        swaps[id] = Swap({
            id: id,
            initiator: initiatorParty,
            counterParty: counterParty,
            initiatorToken: initiatorToken,
            counterPartyToken: counterPartyToken,
            initiatorAmount: initiatorAmount,
            counterPartyAmount: counterPartyAmount,
            initiated: true,
            completed: false
        });

        swapIdsByAddress[initiatorParty].push(id);
        emit SwapBegun(
            id,
            initiatorParty,
            counterParty,
            initiatorToken,
            counterPartyToken,
            initiatorAmount,
            counterPartyAmount
        );
        return id; // Return the trade ID
    }

    function complete(uint256 id) external whenNotPaused onlyCounterParty(id) {
        Swap storage swap = swaps[id];
        IERC20 initiatorToken = IERC20(swap.initiatorToken);
        IERC20 counterPartyToken = IERC20(swap.counterPartyToken);

        uint256 initiatorAmount = swap.initiatorAmount;
        uint256 counterPartyAmount = swap.counterPartyAmount;
        address counterParty = swap.counterParty;
        address initiator = swap.initiator;
        require(
            initiatorToken.transferFrom(
                msg.sender,
                counterParty,
                initiatorAmount
            ),
            "Transfer failed"
        );
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

    function getSwaps(address account) external view returns (Swap[] memory) {
        uint256[] memory swapIds = swapIdsByAddress[account];
        Swap[] memory userSwaps = new Swap[](swapIds.length);

        for (uint256 i = 0; i < swapIds.length; i++) {
            userSwaps[i] = swaps[swapIds[i]];
        }

        return userSwaps;
    }
}