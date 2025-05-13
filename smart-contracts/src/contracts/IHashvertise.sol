// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHashvertise {
    function getOwner() external view returns (address);

    function deposit(address payer, string memory topicId) external payable;

    function getDeposit(
        address payer,
        string memory topicId
    ) external view returns (uint256);

    event Deposited(
        address indexed payer,
        string indexed topicId,
        uint256 amount
    );
}
