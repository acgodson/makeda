// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

pragma solidity ^0.8.0;

contract SwapERC721 {
    function begin(
        address initiatorParty,
        address counterParty,
        address initiatorToken,
        address counterPartyToken,
        uint256 initiatorAmount,
        uint256 counterPartyAmount
    ) public returns (uint256) {}

    function complete(uint256 id) public {}
}
