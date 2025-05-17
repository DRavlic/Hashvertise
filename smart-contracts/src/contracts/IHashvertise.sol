// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHashvertise {
    function getOwner() external view returns (address);

    function deposit(address payer, string memory topicId) external payable;

    function getDeposit(
        address payer,
        string memory topicId
    ) external view returns (uint256);

    function distributePrize(
        address advertiser,
        string memory topicId,
        address[] calldata participants,
        uint256[] calldata amounts
    ) external;

    event Deposited(
        address indexed payer,
        string indexed topicId,
        uint256 amount
    );

    event PrizeDistributed(
        address indexed advertiser,
        string indexed topicId,
        address[] participants,
        uint256[] amounts,
        uint256 totalAmount
    );
}
