// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ECDSA} from "solady/utils/ECDSA.sol";

/// @dev Simple Create2-based account.
contract Create2Account {
    /// @dev Owner of the account.
    address public owner;

    /// @dev Constructor.
    constructor(address _owner) {
        owner = _owner;
    }

    /// @dev Validates the signature with ERC1271 return.
    /// This contract works immediately without any initialization.
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4 result) {
        bool success = ECDSA.recoverCalldata(hash, signature) == owner;
        /// @solidity memory-safe-assembly
        assembly {
            // `success ? bytes4(keccak256("isValidSignature(bytes32,bytes)")) : 0xffffffff`.
            // We use `0xffffffff` for invalid, in convention with the reference implementation.
            result := shl(224, or(0x1626ba7e, sub(0, iszero(success))))
        }
    }
}
