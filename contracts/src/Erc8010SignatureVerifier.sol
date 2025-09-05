// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibBytes} from "solady/utils/LibBytes.sol";
import {Erc6492SignatureVerifier} from "./Erc6492SignatureVerifier.sol";

interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}

contract Erc8010SignatureVerifier {
    function verify(address signer, bytes32 digest, bytes memory wrappedSignature) public returns (bool) {
        uint256 length = wrappedSignature.length;
        bytes32 magic = bytes32(LibBytes.slice(wrappedSignature, length - 32));

        if (magic == 0x8010801080108010801080108010801080108010801080108010801080108010) {
            uint256 contextLength = uint256(bytes32(LibBytes.slice(wrappedSignature, length - 64, length - 32)));
            bytes memory context = LibBytes.slice(wrappedSignature, length - contextLength - 64, length - 64);
            bytes memory signature = LibBytes.slice(wrappedSignature, 0, length - contextLength - 64);

            (bytes memory auth, address initTo, bytes memory initData) = abi.decode(context, (bytes, address, bytes));
            auth;

            if (initData.length > 0) {
                (bool success,) = address(initTo).call(initData);
                require(success, "ERC8010SignatureVerifier: init failed");
            }
            bytes4 magicValue = IERC1271(signer).isValidSignature(digest, signature);
            return magicValue == bytes4(0x1626ba7e);
        }

        return new Erc6492SignatureVerifier().isValidSig(signer, digest, wrappedSignature);
    }
}

contract DeploylessErc8010SignatureVerifier is Erc8010SignatureVerifier {
    constructor(address signer, bytes32 digest, bytes memory signature) {
        bool isValid = verify(signer, digest, signature);
        assembly {
            mstore(0, isValid)
            return(31, 1)
        }
    }
}
