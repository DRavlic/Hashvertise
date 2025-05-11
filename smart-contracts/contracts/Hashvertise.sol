// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Hashvertise
 */
contract Hashvertise {
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
