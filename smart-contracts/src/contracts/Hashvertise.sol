// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Hashvertise {
    address private owner;

    // Tracks HBAR deposits per user per topic ID (campaign)
    mapping(address => mapping(string => uint256)) public deposits;

    event Deposited(
        address indexed payer,
        string indexed topicId,
        uint256 amount
    );

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    /**
     * @notice Deposits HBAR into the contract for a specific topic ID on behalf of a payer.
     * @dev The amount must be sent with the transaction (`msg.value` > 0).
     * @param payer The address credited with the deposit.
     * @param topicId The topic ID (campaign identifier) as a string.
     */
    function deposit(address payer, string memory topicId) external payable {
        require(msg.value > 0, "Must send a positive amount"); // TO DO: Add proper minimum deposit amount after DApp cost analysis

        deposits[payer][topicId] += msg.value;
        emit Deposited(payer, topicId, msg.value);
    }

    /**
     * @notice Returns the total deposited HBAR for a given payer and topic ID.
     * @param payer The address credited with the deposit.
     * @param topicId The topic ID (campaign identifier).
     * @return The total deposited amount in wei (tinybars).
     */
    function getDeposit(
        address payer,
        string memory topicId
    ) external view returns (uint256) {
        return deposits[payer][topicId];
    }

    receive() external payable {}

    fallback() external payable {}
}
