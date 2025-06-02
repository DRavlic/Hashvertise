// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IHashvertise.sol";

contract Hashvertise is IHashvertise {
    address private owner;
    uint256 public constant MAX_PARTICIPANTS = 1000;

    // Tracks HBAR deposits per user per topic ID (campaign)
    mapping(address => mapping(string => uint256)) public deposits;

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

        // TO DO: Deduct fee from the deposit amount after DApp cost analysis, ensure payer paid proper fee
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

    /**
     * @notice Distributes HBAR prizes to participants.
     * @dev Only the contract owner can call this function.
     * @param advertiser The address of the advertiser funding the prizes.
     * @param topicId The identifier for the campaign/topic.
     * @param participants The addresses of participants receiving prizes.
     * @param amounts The HBAR amounts to distribute to each participant.
     */
    function distributePrize(
        address advertiser,
        string calldata topicId,
        address[] calldata participants,
        uint256[] calldata amounts
    ) external {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function"
        );
        require(
            participants.length == amounts.length,
            "'Participants' and 'amounts' arrays must have the same length"
        );
        require(
            participants.length <= MAX_PARTICIPANTS,
            "Exceeded maximum number of participants"
        );

        uint256 prizeAmount = deposits[advertiser][topicId];
        require(prizeAmount > 0, "No prize amount available");

        deposits[advertiser][topicId] = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            require(
                participant != address(0),
                "Participant address cannot be 0"
            );

            uint256 amount = amounts[i];
            require(
                amount > 0 && amount <= prizeAmount,
                "Amount must be greater than 0 and less than or equal to the available prize"
            );

            payable(participant).transfer(amount);
        }

        emit PrizeDistributed(advertiser, topicId, participants, amounts, 0);
    }

    receive() external payable {}

    fallback() external payable {}
}
