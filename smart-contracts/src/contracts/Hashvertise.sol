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

    function getOwners() public view returns (address) {
        return owner;
    }
}
