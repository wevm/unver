import * as ethers from 'ethers'
import * as Constants from './Constants.ts'

const abiCoder = ethers.AbiCoder.defaultAbiCoder()

export async function verify(
	address: string,
	digest: Uint8Array | string,
	signature: ethers.SignatureLike,
	provider: ethers.AbstractProvider,
): Promise<boolean> {
	if (typeof signature === 'string') {
		if (
			ethers.dataSlice(signature, -32) ===
			'0x8010801080108010801080108010801080108010801080108010801080108010'
		) {
			const result = await verifyErc8010(address, digest, signature, provider)
			if (result) return true
		}
		const result = await verifyErc6492(address, digest, signature, provider)
		if (result) return true
	}
	return verifyEcdsa(address, digest, signature)
}

export async function verifyMessage(
	_address: string,
	_message: Uint8Array | string,
	_signature: ethers.SignatureLike,
	_provider: ethers.AbstractProvider,
): Promise<boolean> {
	throw new Error('TODO')
}

export async function verifyTypedData(
	_domain: ethers.TypedDataDomain,
	_types: Record<string, Array<ethers.TypedDataField>>,
	_value: Record<string, unknown>,
	_signature: ethers.SignatureLike,
	_provider: ethers.AbstractProvider,
): Promise<boolean> {
	throw new Error('TODO')
}

/** @internal */
async function verifyErc8010(
	address: string,
	digest: Uint8Array | string,
	signature: string,
	provider: ethers.AbstractProvider,
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
		return await verifyErc6492(address, digest, signature, provider)

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
	address: string,
	digest: Uint8Array | string,
	signature: string,
	provider: ethers.AbstractProvider,
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
