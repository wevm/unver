import * as test from 'bun:test'
import * as ethers from 'ethers'
import * as prool from 'prool/instances'

import {
  Create2Factory,
  Eoa,
  EoaInitializer,
  EoaOptional,
} from '../contracts/generated.ts'
import { VerifyProvider } from './index.ts'

const abiCoder = ethers.AbiCoder.defaultAbiCoder()
const anvil = prool.anvil()
const provider = VerifyProvider.wrap(
  new ethers.JsonRpcProvider(`http://localhost:${anvil.port}`, undefined, {
    cacheTimeout: -1,
  }),
)
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
      const valid = await provider.verifyHash(account, digest, wrappedSignature)
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        account,
        ethers.randomBytes(32),
        signature.serialized,
      )
      test.expect(invalid).toBe(false)
    })

    test.it('deployed', async () => {
      const account = await create2Factory.createAccount?.staticCall(
        wallet.address,
      )
      await create2Factory.createAccount?.send(wallet.address)

      const digest = ethers.randomBytes(32)
      const signature = wallet.signingKey.sign(digest)

      // Test valid
      const valid = await provider.verifyHash(
        account,
        digest,
        signature.serialized,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        account,
        ethers.randomBytes(32),
        signature.serialized,
      )
      test.expect(invalid).toBe(false)
    })
  })

  // TODO: Implement
  test.describe('erc8010', async () => {
    let eoa: ethers.Contract
    let eoaWithInit: ethers.Contract
    let initializer: ethers.Contract

    test.beforeAll(async () => {
      {
        const factory = new ethers.ContractFactory(
          EoaOptional.abi,
          EoaOptional.bytecode.object,
          wallet,
        )
        const address = await factory.deploy().then((x) => x.getAddress())
        eoa = new ethers.Contract(address, EoaOptional.abi, wallet)
      }

      {
        const factory = new ethers.ContractFactory(
          Eoa.abi,
          Eoa.bytecode.object,
          wallet,
        )
        const address = await factory.deploy().then((x) => x.getAddress())
        eoaWithInit = new ethers.Contract(address, Eoa.abi, wallet)
      }

      {
        const factory = new ethers.ContractFactory(
          EoaInitializer.abi,
          EoaInitializer.bytecode.object,
          wallet,
        )
        const address = await factory.deploy().then((x) => x.getAddress())
        initializer = new ethers.Contract(address, EoaInitializer.abi, wallet)
      }
    })

    test.it('predelegated', async () => {
      const newWallet = ethers.Wallet.createRandom(provider)

      const authorization = await newWallet.authorize({
        address: await eoa.getAddress(),
      })

      const digest = ethers.randomBytes(32)
      const signature = newWallet.signingKey.sign(digest)

      const context = abiCoder.encode(
        ['bytes', 'address', 'bytes'],
        [
          abiCoder.encode(
            ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
            [
              authorization.chainId,
              authorization.address,
              authorization.nonce,
              authorization.signature.yParity,
              authorization.signature.r,
              authorization.signature.s,
            ],
          ),
          newWallet.address,
          '0x',
        ],
      )

      const wrappedSignature = ethers.concat([
        signature.serialized,
        context,
        ethers.toBeHex(ethers.dataLength(context), 32),
        '0x8010801080108010801080108010801080108010801080108010801080108010',
      ])

      // Test valid
      const valid = await provider.verifyHash(
        newWallet.address,
        digest,
        wrappedSignature,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        newWallet.address,
        ethers.randomBytes(32),
        wrappedSignature,
      )
      test.expect(invalid).toBe(false)
    })

    test.it('predelegated (with init)', async () => {
      const newWallet = ethers.Wallet.createRandom(provider)

      const authorization = await newWallet.authorize({
        address: await eoaWithInit.getAddress(),
      })

      const digest = ethers.randomBytes(32)
      const signature = newWallet.signingKey.sign(digest)

      const context = abiCoder.encode(
        ['bytes', 'address', 'bytes'],
        [
          abiCoder.encode(
            ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
            [
              authorization.chainId,
              authorization.address,
              authorization.nonce,
              authorization.signature.yParity,
              authorization.signature.r,
              authorization.signature.s,
            ],
          ),
          newWallet.address,
          eoaWithInit.interface.encodeFunctionData('initialize'),
        ],
      )

      const wrappedSignature = ethers.concat([
        signature.serialized,
        context,
        ethers.toBeHex(ethers.dataLength(context), 32),
        '0x8010801080108010801080108010801080108010801080108010801080108010',
      ])

      // Test valid
      const valid = await provider.verifyHash(
        newWallet.address,
        digest,
        wrappedSignature,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        newWallet.address,
        ethers.randomBytes(32),
        wrappedSignature,
      )
      test.expect(invalid).toBe(false)
    })

    test.it('predelegated (with init; external initializer)', async () => {
      const newWallet = ethers.Wallet.createRandom(provider)

      const authorization = await newWallet.authorize({
        address: await eoaWithInit.getAddress(),
      })

      const digest = ethers.randomBytes(32)
      const signature = newWallet.signingKey.sign(digest)

      const context = abiCoder.encode(
        ['bytes', 'address', 'bytes'],
        [
          abiCoder.encode(
            ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
            [
              authorization.chainId,
              authorization.address,
              authorization.nonce,
              authorization.signature.yParity,
              authorization.signature.r,
              authorization.signature.s,
            ],
          ),
          await initializer.getAddress(),
          initializer.interface.encodeFunctionData('initialize', [
            newWallet.address,
          ]),
        ],
      )

      const wrappedSignature = ethers.concat([
        signature.serialized,
        context,
        ethers.toBeHex(ethers.dataLength(context), 32),
        '0x8010801080108010801080108010801080108010801080108010801080108010',
      ])

      // Test valid
      const valid = await provider.verifyHash(
        newWallet.address,
        digest,
        wrappedSignature,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        newWallet.address,
        ethers.randomBytes(32),
        wrappedSignature,
      )
      test.expect(invalid).toBe(false)
    })

    test.it('delegated', async () => {
      const newWallet = ethers.Wallet.createRandom(provider)

      const authorization = await newWallet.authorize({
        address: await eoa.getAddress(),
      })
      await wallet.sendTransaction({
        authorizationList: [authorization],
        to: '0x0000000000000000000000000000000000000000',
      })

      const digest = ethers.randomBytes(32)
      const signature = newWallet.signingKey.sign(digest)

      // Test valid
      const valid = await provider.verifyHash(
        newWallet.address,
        digest,
        signature.serialized,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        newWallet.address,
        ethers.randomBytes(32),
        signature.serialized,
      )
      test.expect(invalid).toBe(false)
    })

    test.it('delegated (with wrapped signature)', async () => {
      const newWallet = ethers.Wallet.createRandom(provider)

      const authorization = await newWallet.authorize({
        address: await eoaWithInit.getAddress(),
      })
      await wallet.sendTransaction({
        authorizationList: [authorization],
        to: '0x0000000000000000000000000000000000000000',
      })

      const digest = ethers.randomBytes(32)
      const signature = newWallet.signingKey.sign(digest)

      const context = abiCoder.encode(
        ['bytes', 'address', 'bytes'],
        [
          abiCoder.encode(
            ['uint256', 'address', 'uint256', 'uint8', 'uint256', 'uint256'],
            [
              authorization.chainId,
              authorization.address,
              authorization.nonce,
              authorization.signature.yParity,
              authorization.signature.r,
              authorization.signature.s,
            ],
          ),
          await initializer.getAddress(),
          initializer.interface.encodeFunctionData('initialize', [
            newWallet.address,
          ]),
        ],
      )

      const wrappedSignature = ethers.concat([
        signature.serialized,
        context,
        ethers.toBeHex(ethers.dataLength(context), 32),
        '0x8010801080108010801080108010801080108010801080108010801080108010',
      ])

      // Test valid
      const valid = await provider.verifyHash(
        newWallet.address,
        digest,
        wrappedSignature,
      )
      test.expect(valid).toBe(true)

      // Test invalid
      const invalid = await provider.verifyHash(
        newWallet.address,
        ethers.randomBytes(32),
        wrappedSignature,
      )
      test.expect(invalid).toBe(false)
    })
  })

  test.it('ecdsa', async () => {
    const digest = ethers.randomBytes(32)
    const wallet = ethers.Wallet.createRandom()
    const signature = wallet.signingKey.sign(digest)

    // Test valid
    const valid = await provider.verifyHash(
      wallet.address,
      digest,
      signature.serialized,
    )
    test.expect(valid).toBe(true)

    // Test invalid
    const invalid = await provider.verifyHash(
      wallet.address,
      ethers.randomBytes(32),
      signature.serialized,
    )
    test.expect(invalid).toBe(false)
  })
})
