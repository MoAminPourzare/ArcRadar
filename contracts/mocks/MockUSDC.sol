// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockUSDC {
    string public constant name = "Mock Arc USDC";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;

    bool public transferFromShouldReturnFalse;

    mapping(address account => uint256 balance) public balanceOf;
    mapping(address owner => mapping(address spender => uint256 amount)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    error InsufficientAllowance();
    error InsufficientBalance();
    error InvalidRecipient();

    function mint(address account, uint256 amount) external {
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        if (transferFromShouldReturnFalse) {
            return false;
        }

        if (to == address(0)) {
            revert InvalidRecipient();
        }

        uint256 currentAllowance = allowance[from][msg.sender];

        if (currentAllowance < amount) {
            revert InsufficientAllowance();
        }

        if (balanceOf[from] < amount) {
            revert InsufficientBalance();
        }

        if (currentAllowance != type(uint256).max) {
            allowance[from][msg.sender] = currentAllowance - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function setTransferFromShouldReturnFalse(bool value) external {
        transferFromShouldReturnFalse = value;
    }
}
