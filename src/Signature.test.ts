import * as test from 'bun:test'
import * as ethers from 'ethers'
import * as prool from 'prool/instances'

import { Create2Factory } from '../contracts/generated.ts'
import { Signature } from './index.ts'

const abiCoder = ethers.AbiCoder.defaultAbiCoder()
const anvil = prool.anvil()
const provider = new ethers.JsonRpcProvider(`http://localhost:${anvil.port}`)
const wallet = ethers.Wallet.fromPhrase(
	'test test test test test test test test test test test junk',
	provider,
)

test.beforeAll(async () => {
	await anvil.start()
})
test.afterAll(async () => await anvil.stop())

test.describe('verify', () => {
	test.describe('erc6492', async () => {
		let create2Factory: ethers.Contract

		test.beforeAll(async () => {
			// Deploy Create2Factory
			const factory = new ethers.ContractFactory(
				Create2Factory.abi,
				Create2Factory.bytecode.object,
				wallet,
			)
			const address = await factory.deploy().then((x) => x.getAddress())
			create2Factory = new ethers.Contract(address, Create2Factory.abi, wallet)
		})

		test.it('predeployed', async () => {
			const account = await create2Factory.createAccount?.staticCall(
				wallet.address,
			)

			const digest = ethers.randomBytes(32)
			const signature = wallet.signingKey.sign(digest)

			const wrappedSignature = ethers.concat([
				abiCoder.encode(
					['address', 'bytes', 'bytes'],
					[
						await create2Factory.getAddress(),
						create2Factory.interface.encodeFunctionData('createAccount', [
							wallet.address,
						]),
						signature.serialized,
					],
				),
				'0x6492649264926492649264926492649264926492649264926492649264926492',
			])

			// Test valid
			const valid = await Signature.verify(
				account,
				digest,
				wrappedSignature,
				provider,
			)
			test.expect(valid).toBe(true)

			// Test invalid
			const invalid = await Signature.verify(
				account,
				ethers.randomBytes(32),
				signature.serialized,
				provider,
			)
			test.expect(invalid).toBe(false)
		})

		test.it('deployed', async () => {
			const account = await create2Factory.createAccount?.staticCall(
				wallet.address,
			)
			await create2Factory.createAccount?.send(wallet.address, {
				nonce: await wallet.getNonce(),
			})

			const digest = ethers.randomBytes(32)
			const signature = wallet.signingKey.sign(digest)

			// Test valid
			const valid = await Signature.verify(
				account,
				digest,
				signature.serialized,
				provider,
			)
			test.expect(valid).toBe(true)

			// Test invalid
			const invalid = await Signature.verify(
				account,
				ethers.randomBytes(32),
				signature.serialized,
				provider,
			)
			test.expect(invalid).toBe(false)
		})
	})

	// TODO: Implement
	// test.describe('erc8010')

	test.it('ecdsa', async () => {
		const digest = ethers.randomBytes(32)
		const wallet = ethers.Wallet.createRandom()
		const signature = wallet.signingKey.sign(digest)

		// Test valid
		const valid = await Signature.verify(
			wallet.address,
			digest,
			signature.serialized,
			provider,
		)
		test.expect(valid).toBe(true)

		// Test invalid
		const invalid = await Signature.verify(
			wallet.address,
			ethers.randomBytes(32),
			signature.serialized,
			provider,
		)
		test.expect(invalid).toBe(false)
	})
})
