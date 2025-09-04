# [WIP] unver

Signature Verification utilities for [ethers.js](https://github.com/ethers-io/ethers.js).

## Usage

```ts
import * as ethers from 'ethers'
import * as unver from 'unver'

const provider = new ethers.JsonRpcProvider('https://eth.merkle.io')

const address = '0x...'
const digest = '0x...'
const signature = '0x...'

const valid = await unver.verify(address, digest, signature, provider)
```

## Development

```bash
bun install  # Install dependencies
bun test     # Run tests
```