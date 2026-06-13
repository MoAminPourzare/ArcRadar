// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TipRouter {
    uint256 public constant MAX_PROJECT_ID_LENGTH = 96;
    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    IERC20 public immutable usdc;
    address public owner;

    mapping(bytes32 projectKey => address recipient) private projectRecipients;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ProjectRecipientSet(string projectId, address indexed recipient);
    event ProjectRecipientRemoved(string projectId, address indexed previousRecipient);
    event ProjectTipped(
        string projectId,
        address indexed tipper,
        address indexed recipient,
        uint256 amount,
        string message
    );

    error AmountMustBePositive();
    error ArrayLengthMismatch();
    error EmptyProjectId();
    error InvalidOwner();
    error InvalidRecipient();
    error InvalidUsdc();
    error MessageTooLong();
    error ProjectIdTooLong();
    error ProjectNotRegistered();
    error Unauthorized();
    error UsdcTransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    constructor(address usdcAddress) {
        if (usdcAddress == address(0)) {
            revert InvalidUsdc();
        }

        usdc = IERC20(usdcAddress);
        owner = msg.sender;

        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert InvalidOwner();
        }

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function setProjectRecipient(
        string calldata projectId,
        address recipient
    ) external onlyOwner {
        _setProjectRecipient(projectId, recipient);
    }

    function setProjectRecipients(
        string[] calldata projectIds,
        address[] calldata recipients
    ) external onlyOwner {
        if (projectIds.length != recipients.length) {
            revert ArrayLengthMismatch();
        }

        for (uint256 index = 0; index < projectIds.length; index++) {
            _setProjectRecipient(projectIds[index], recipients[index]);
        }
    }

    function removeProjectRecipient(string calldata projectId) external onlyOwner {
        bytes32 projectKey = _projectKey(projectId);
        address previousRecipient = projectRecipients[projectKey];

        if (previousRecipient == address(0)) {
            revert ProjectNotRegistered();
        }

        delete projectRecipients[projectKey];

        emit ProjectRecipientRemoved(projectId, previousRecipient);
    }

    function getProjectRecipient(
        string calldata projectId
    ) external view returns (address) {
        return projectRecipients[_projectKey(projectId)];
    }

    function tip(
        string calldata projectId,
        uint256 amount,
        string calldata message
    ) external {
        if (amount == 0) {
            revert AmountMustBePositive();
        }

        if (bytes(message).length > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong();
        }

        address recipient = projectRecipients[_projectKey(projectId)];

        if (recipient == address(0)) {
            revert ProjectNotRegistered();
        }

        _safeTransferFrom(address(usdc), msg.sender, recipient, amount);

        emit ProjectTipped(projectId, msg.sender, recipient, amount, message);
    }

    function _setProjectRecipient(
        string calldata projectId,
        address recipient
    ) private {
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        projectRecipients[_projectKey(projectId)] = recipient;

        emit ProjectRecipientSet(projectId, recipient);
    }

    function _projectKey(string calldata projectId) private pure returns (bytes32) {
        uint256 projectIdLength = bytes(projectId).length;

        if (projectIdLength == 0) {
            revert EmptyProjectId();
        }

        if (projectIdLength > MAX_PROJECT_ID_LENGTH) {
            revert ProjectIdTooLong();
        }

        return keccak256(bytes(projectId));
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );

        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert UsdcTransferFailed();
        }
    }
}
