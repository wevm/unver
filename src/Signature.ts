import * as ethers from 'ethers'
import * as Constants from './Constants.ts'

const abiCoder = ethers.AbiCoder.defaultAbiCoder()

/**
 * Verifies a `signature` for a given `address` and `digest`.
 *
 * @deprecated Use `verifyHash` from `viem/actions` instead.
 *
 * @param provider - The ethers.AbstractProvider to use for verification.
 * @param address - The address of the signer.
 * @param digest - The digest to verify.
 * @param signature - The signature to verify.
 * @returns Whether the signature is valid.
 */
export async function verifyHash(
  provider: ethers.AbstractProvider,
  address: string,
  digest: Uint8Array | string,
  signature: ethers.SignatureLike,
): Promise<boolean> {
  if (typeof signature === 'string') {
    if (
      ethers.dataSlice(signature, -32) ===
      '0x8010801080108010801080108010801080108010801080108010801080108010'
    ) {
      const result = await verifyErc8010(provider, address, digest, signature)
      if (result) return true
    }
    const result = await verifyErc6492(provider, address, digest, signature)
    if (result) return true
  }
  return verifyEcdsa(address, digest, signature)
}

/**
 * Verifies a `signature` for a given `address` and `message`.
 *
 * @deprecated Use `verifyMessage` from `viem/actions` instead.
 *
 * @param provider - The ethers.AbstractProvider to use for verification.
 * @param address - The address of the signer.
 * @param message - The message to verify.
 * @param signature - The signature to verify.
 * @returns Whether the signature is valid.
 */
export async function verifyMessage(
  provider: ethers.AbstractProvider,
  address: string,
  message: Uint8Array | string,
  signature: ethers.SignatureLike,
): Promise<boolean> {
  const digest = ethers.hashMessage(message)
  return verifyHash(provider, address, digest, signature)
}

/**
 * Verifies a `signature` for a given `address` and `typedData`.
 *
 * @deprecated Use `verifyTypedData` from `viem/actions` instead.
 *
 * @param provider - The ethers.AbstractProvider to use for verification.
 * @param address - The address of the signer.
 * @param domain - The domain of the typed data.
 * @param types - The types of the typed data.
 * @param value - The value of the typed data.
 * @param signature - The signature to verify.
 * @returns Whether the signature is valid.
 */
export async function verifyTypedData(
  provider: ethers.AbstractProvider,
  address: string,
  domain: ethers.TypedDataDomain,
  types: Record<string, Array<ethers.TypedDataField>>,
  value: Record<string, unknown>,
  signature: ethers.SignatureLike,
): Promise<boolean> {
  const digest = ethers.TypedDataEncoder.hash(domain, types, value)
  return verifyHash(provider, address, digest, signature)
}

/** @internal */
async function verifyErc8010(
  provider: ethers.AbstractProvider,
  address: string,
  digest: Uint8Array | string,
  signature: string,
): Promise<boolean> {
  const contextLength = ethers.toNumber(ethers.dataSlice(signature, -64, -32))
  const context = ethers.dataSlice(signature, -contextLength - 64, -64)

  const [auth] = abiCoder.decode(['bytes'], context)
  const [chainId, delegation, nonce, yParity, r, s] = abiCoder.decode(
    ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
    auth,
  )
  const authorization = ethers.authorizationify({
    address: delegation,
    chainId,
    nonce,
    signature: {
      yParity: ethers.toNumber(yParity) as 0 | 1,
      r: ethers.toBeHex(r, 32),
      s: ethers.toBeHex(s, 32),
    },
  })

  // Check if already delegated
  const code = await provider.getCode(address)
  if (code === ethers.concat(['0xef0100', address]))
    return await verifyErc6492(provider, address, digest, signature)

  // Verify authorization
  const address_recovered = ethers.verifyAuthorization(
    authorization,
    authorization.signature,
  )
  if (address.toLowerCase() !== address_recovered.toLowerCase()) return false

  const result = await provider
    .call({
      authorizationList: [authorization],
      blockTag: 'pending',
      data: ethers.concat([
        Constants.erc8010Bytecode,
        abiCoder.encode(
          ['address', 'bytes32', 'bytes'],
          [address, ethers.hexlify(digest), signature],
        ),
      ]),
    })
    .catch(() => '0x00')
  return result === '0x01'
}

/** @internal */
async function verifyErc6492(
  provider: ethers.AbstractProvider,
  address: string,
  digest: Uint8Array | string,
  signature: string,
): Promise<boolean> {
  const data = abiCoder.encode(
    ['address', 'bytes32', 'bytes'],
    [address, ethers.hexlify(digest), signature],
  )
  const result = await provider
    .call({
      blockTag: 'pending',
      data: ethers.concat([Constants.erc6492Bytecode, data]),
    })
    .catch(() => '0x00')
  return result === '0x01'
}

/** @internal */
function verifyEcdsa(
  address: string,
  digest: Uint8Array | string,
  signature: ethers.SignatureLike,
): boolean {
  try {
    const address_recovered = ethers.recoverAddress(digest, signature)
    return address.toLowerCase() === address_recovered.toLowerCase()
  } catch {
    return false
  }
}
