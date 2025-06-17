// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IHashvertise {
    function deposit(address payer, string memory topicId) external payable;

    function getPrizeAmount(
        address payer,
        string memory topicId
    ) external view returns (uint256);

    function distributePrize(
        address advertiser,
        string memory topicId,
        address[] calldata participants,
        uint256[] calldata amounts
    ) external;

    function withdrawFees() external;

    function setFeeRate(uint256 _feeBasisPoints) external;

    function setMinimumDeposit(uint256 _minimumDeposit) external;

    function getFeeBasisPoints() external view returns (uint256);

    function getMinimumDeposit() external view returns (uint256);

    function getAbsoluteMinimumDeposit() external view returns (uint256);

    event Deposited(
        address indexed payer,
        string indexed topicId,
        uint256 prizeAmount,
        uint256 feeAmount
    );

    event PrizeDistributed(
        address indexed advertiser,
        string indexed topicId,
        address[] participants,
        uint256[] amounts,
        uint256 totalAmount
    );

    event FeesWithdrawn(address indexed owner, uint256 amount);

    event FeeRateChanged(uint256 oldFeeRate, uint256 newFeeRate);

    event MinimumDepositChanged(
        uint256 oldMinimumDeposit,
        uint256 newMinimumDeposit
    );
}
