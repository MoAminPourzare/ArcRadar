// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TipRouter {
    uint256 public constant MAX_PROJECT_ID_LENGTH = 96;
    uint256 public constant MAX_MESSAGE_LENGTH = 280;

    IERC20 public immutable usdc;

    event ProjectTipped(
        string projectId,
        address tipper,
        address recipient,
        uint256 amount,
        string message
    );

    error InvalidUsdc();
    error EmptyProjectId();
    error ProjectIdTooLong();
    error InvalidRecipient();
    error AmountMustBePositive();
    error MessageTooLong();
    error UsdcTransferFailed();

    constructor(address usdcAddress) {
        if (usdcAddress == address(0)) {
            revert InvalidUsdc();
        }

        usdc = IERC20(usdcAddress);
    }

    function tip(
        string calldata projectId,
        address recipient,
        uint256 amount,
        string calldata message
    ) external {
        uint256 projectIdLength = bytes(projectId).length;
        uint256 messageLength = bytes(message).length;

        if (projectIdLength == 0) {
            revert EmptyProjectId();
        }

        if (projectIdLength > MAX_PROJECT_ID_LENGTH) {
            revert ProjectIdTooLong();
        }

        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        if (amount == 0) {
            revert AmountMustBePositive();
        }

        if (messageLength > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong();
        }

        _safeTransferFrom(address(usdc), msg.sender, recipient, amount);

        emit ProjectTipped(projectId, msg.sender, recipient, amount, message);
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
