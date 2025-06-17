// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IHashvertise.sol";

contract Hashvertise is IHashvertise, Ownable {
    uint256 public constant MAX_PARTICIPANTS = 1000;
    uint256 public constant ABSOLUTE_MINIMUM_DEPOSIT = 100000000; // 1 HBAR in tinybars
    uint256 private constant BASIS_POINTS_DIVISOR = 10000;

    // Platform fee in basis points, e.g. 1% = 100 basis points
    uint256 public feeBasisPoints;

    // Minimum deposit amount for campaign creation
    uint256 public minimumDeposit;

    // Total accumulated fees in the contract
    uint256 public totalFees;

    // Tracks available prize amounts per advertiser per topic ID (campaign)
    mapping(address => mapping(string => uint256)) public prizes;

    // IMPORTANT: deploy with ECDSA key in order for msg.sender to be decoded properly
    constructor(
        uint256 _feeBasisPoints,
        uint256 _minimumDeposit // TODO: Set proper minimum deposit amount after DApp cost analysis
    ) Ownable(msg.sender) {
        require(
            _minimumDeposit >= ABSOLUTE_MINIMUM_DEPOSIT,
            "Minimum deposit cannot be below 1 HBAR"
        );
        feeBasisPoints = _feeBasisPoints;
        minimumDeposit = _minimumDeposit;
    }

    /**
     * @notice Deposits HBAR into the contract for a specific topic ID on behalf of a payer and deducts platform fee.
     * @dev The amount must be sent with the transaction (`msg.value` >= minimumDeposit).
     * @param payer The address credited with the deposit.
     * @param topicId The topic ID (campaign identifier) as a string.
     */
    function deposit(address payer, string memory topicId) external payable {
        require(msg.value >= minimumDeposit, "Deposit below minimum amount");

        // Calculate fee and prize amount
        uint256 feeAmount = (msg.value * feeBasisPoints) / BASIS_POINTS_DIVISOR;
        uint256 prizeAmount = msg.value - feeAmount;

        // Update balances
        prizes[payer][topicId] += prizeAmount;
        totalFees += feeAmount;

        emit Deposited(payer, topicId, prizeAmount, feeAmount);
    }

    /**
     * @notice Returns the total available prize amount for a given payer and topic ID.
     * @param payer The address credited with the deposit.
     * @param topicId The topic ID (campaign identifier).
     * @return The total available prize amount in wei (tinybars).
     */
    function getPrizeAmount(
        address payer,
        string memory topicId
    ) external view returns (uint256) {
        return prizes[payer][topicId];
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
    ) external onlyOwner {
        require(
            participants.length == amounts.length,
            "'Participants' and 'amounts' arrays must have the same length"
        );
        require(
            participants.length <= MAX_PARTICIPANTS,
            "Exceeded maximum number of participants"
        );

        uint256 prizeAmount = prizes[advertiser][topicId];
        require(prizeAmount > 0, "No prize amount available");

        prizes[advertiser][topicId] = 0;

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

    /**
     * @notice Withdraws all accumulated fees from the contract.
     * @dev Only the contract owner can call this function.
     *      Transfers all accumulated fees to the owner's address.
     */
    function withdrawFees() external onlyOwner {
        uint256 feesToWithdraw = totalFees;
        require(feesToWithdraw > 0, "No fees to withdraw");

        totalFees = 0;
        payable(owner()).transfer(feesToWithdraw);

        emit FeesWithdrawn(owner(), feesToWithdraw);
    }

    /**
     * @notice Sets the platform fee rate.
     * @dev Only the contract owner can call this function.
     * @param _feeBasisPoints The new fee rate in basis points.
     */
    function setFeeRate(uint256 _feeBasisPoints) external onlyOwner {
        uint256 oldFee = feeBasisPoints;
        feeBasisPoints = _feeBasisPoints;
        emit FeeRateChanged(oldFee, _feeBasisPoints);
    }

    /**
     * @notice Sets the minimum deposit amount.
     * @dev Only the contract owner can call this function.
     * @param _minimumDeposit The new minimum deposit amount in tinybars.
     */
    function setMinimumDeposit(uint256 _minimumDeposit) external onlyOwner {
        uint256 oldMinimum = minimumDeposit;
        require(
            _minimumDeposit >= ABSOLUTE_MINIMUM_DEPOSIT,
            "Minimum deposit cannot be below 1 HBAR"
        );
        minimumDeposit = _minimumDeposit;
        emit MinimumDepositChanged(oldMinimum, _minimumDeposit);
    }

    /**
     * @notice Returns the current fee rate in basis points.
     * @return The fee rate in basis points (e.g., 100 = 1%).
     */
    function getFeeBasisPoints() external view returns (uint256) {
        return feeBasisPoints;
    }

    /**
     * @notice Returns the current minimum deposit amount.
     * @return The minimum deposit amount in tinybars.
     */
    function getMinimumDeposit() external view returns (uint256) {
        return minimumDeposit;
    }

    /**
     * @notice Returns the absolute minimum deposit amount that cannot be changed.
     * @return The absolute minimum deposit amount in tinybars (1 HBAR).
     */
    function getAbsoluteMinimumDeposit() external pure returns (uint256) {
        return ABSOLUTE_MINIMUM_DEPOSIT;
    }

    receive() external payable {}

    fallback() external payable {}
}
