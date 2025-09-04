# [WIP] unver

Signature Verification utilities for [ethers.js](https://github.com/ethers-io/ethers.js), with support for:
- Externally Owned Accounts
- Contract Accounts via [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271)
- Predeployed Contract Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492)
- Predelegated Contract Accounts via [ERC-8010](https://github.com/jxom/ERCs/blob/799f618e1f9b7ad1dcdf3ccc46b9b7a9309c086f/ERCS/erc-8010.md)

## Usage

```ts
import * as ethers from 'ethers'
import * as unver from 'unver'

const provider = new ethers.JsonRpcProvider('https://eth.merkle.io')

const address = '0x...'
const digest = '0x...'
const signature = '0x...'

const valid = await unver.Signature.verify(address, digest, signature, provider)
```

## Development

```bash
bun install  # Install dependencies
bun test     # Run tests
```
