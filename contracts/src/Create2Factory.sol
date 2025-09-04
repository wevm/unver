// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Create2Account} from "./Create2Account.sol";

/// @dev Simple CREATE2 factory for deterministic Account deployment.
contract Create2Factory {
    /// @dev Creates an Account with a salt based on the owner's address.
    /// @return account The address of the created Account.
    function createAccount(address owner) public returns (address account) {
        bytes32 salt = keccak256(abi.encodePacked(owner));
        account = address(new Create2Account{salt: salt}(owner));
    }

    /// @dev Predicts the address using the salt for an owner.
    /// @param owner The owner of the Account.
    /// @return account The predicted address of the Account.
    function getAddress(address owner) public view returns (address account) {
        bytes32 salt = keccak256(abi.encodePacked(owner));
        account = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            keccak256(abi.encodePacked(type(Create2Account).creationCode, abi.encode(owner)))
                        )
                    )
                )
            )
        );
    }
}
