// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Multicall3} from "multicall3/Multicall3.sol";

contract DeploylessMulticall {
    constructor(Multicall3.Call3[] memory calls) {
        Multicall3 multicall3 = new Multicall3();
        Multicall3.Result[] memory results = multicall3.aggregate3(calls);

        bytes memory encoded = abi.encode(results);

        assembly {
            let ptr := add(encoded, 0x20) // Skip the length prefix
            let size := mload(encoded)
            return(ptr, size)
        }
    }
}
