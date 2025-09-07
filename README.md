# unver

Universal Signature Verification for [ethers.js](https://github.com/ethers-io/ethers.js), with support for:
- Externally Owned Accounts
- Contract Accounts via [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271)
- Predeployed Contract Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492)
- Predelegated Contract Accounts via [ERC-8010](https://github.com/jxom/ERCs/blob/799f618e1f9b7ad1dcdf3ccc46b9b7a9309c086f/ERCS/erc-8010.md)

## Table of Contents

- [Usage](#usage)
- [API Reference](#api-reference)
  - [`VerifyProvider.wrap`](#verifyproviderwrap)
  - [`Signature.verifyHash`](#signatureverifyhash)
  - [`Signature.verifyMessage`](#signatureverifymessage)
  - [`Signature.verifyTypedData`](#signatureverifytypeddata)
- [Development](#development)


## Usage

```ts
import * as ethers from 'ethers'
import { VerifyProvider } from 'unver'

const provider = VerifyProvider.wrap(
  new ethers.JsonRpcProvider('https://eth.merkle.io')
)

const address = '0x...'
const digest = '0x...'
const signature = '0x...'

const valid = await provider.verifyHash(address, digest, signature)
```

## API Reference

### `VerifyProvider.wrap`

Wraps an `ethers.AbstractProvider` with the `VerifyProvider` interface.

```ts
const provider = VerifyProvider.wrap(
  new ethers.JsonRpcProvider('https://eth.merkle.io')
)
```

#### Interface

```ts
declare function wrap(provider: ethers.AbstractProvider): 
  Provider<ethers.AbstractProvider & VerifyProvider> 
```

### `Signature.verifyHash`

Verifies a `signature` for a given `address` and `digest`.

```ts
const address = '0x...'
const digest = '0x...'
const signature = '0x...'

// Provider usage
const valid = await provider.verifyHash(address, digest, signature)

// Function usage
import { Signature } from 'unver'
const valid = await Signature.verifyHash(provider, address, digest, signature)
```

#### Interface

```ts
declare function verifyHash(
  provider: ethers.AbstractProvider,
  address: string,
  digest: Uint8Array | string,
  signature: ethers.SignatureLike,
): Promise<boolean>
```

### `Signature.verifyMessage`

Verifies a `signature` for a given `address` and `message`.

```ts
const address = '0x...'
const message = 'hello world'
const signature = '0x...'

// Provider usage
const valid = await provider.verifyMessage(address, message, signature)

// Function usage
import { Signature } from 'unver'
const valid = await Signature.verifyMessage(provider, address, message, signature)
```

#### Interface

```ts
declare function verifyMessage(
  provider: ethers.AbstractProvider,
  address: string,
  message: Uint8Array | string,
  signature: ethers.SignatureLike,
): Promise<boolean>
```

### `Signature.verifyTypedData`

Verifies a `signature` for a given `address` and `typedData`.

```ts
const address = '0x...'
const domain = {
  name: 'My App',
  version: '1.0.0',
  chainId: 1,
  verifyingContract: '0x...'
}
const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'age', type: 'uint256' },
  ],
}
const value = {
  name: 'John Doe',
  age: 20,
}
const signature = '0x...'

// Provider usage
const valid = await provider.verifyTypedData(address, domain, types, value, signature)

// Function usage
import { Signature } from 'unver'
const valid = await Signature.verifyTypedData(provider, address, domain, types, value, signature)
```

#### Interface

```ts
declare function verifyTypedData(
  provider: ethers.AbstractProvider,
  address: string,
  domain: ethers.TypedDataDomain,
  types: Record<string, Array<ethers.TypedDataField>>,
  value: Record<string, unknown>,
  signature: ethers.SignatureLike,
): Promise<boolean>
```

## Development

```bash
bun install  # Install dependencies
bun test     # Run tests
```

## Community

Check out the following places for more content:

- Follow [@wevm_dev](https://x.com/wevm_dev), [@jxom](https://x.com/_jxom), and [@awkweb](https://x.com/awkweb) on Twitter for project updates

## Support

- [GitHub Sponsors](https://github.com/sponsors/wevm?metadata_campaign=docs_support)
- [Gitcoin Grant](https://wagmi.sh/gitcoin)
- [wevm.eth](https://etherscan.io/enslookup-search?search=wevm.eth)
 