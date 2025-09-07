import type * as ethers from 'ethers'
import * as Signature from './Signature.ts'

export type Provider<provider extends ethers.AbstractProvider> = provider &
  Provider.Interface

export namespace Provider {
  export interface Interface {
    verifyHash(
      address: string,
      digest: Uint8Array | string,
      signature: ethers.SignatureLike,
    ): Promise<boolean>
    verifyMessage(
      address: string,
      message: Uint8Array | string,
      signature: ethers.SignatureLike,
    ): Promise<boolean>
    verifyTypedData(
      address: string,
      domain: ethers.TypedDataDomain,
      types: Record<string, Array<ethers.TypedDataField>>,
      value: Record<string, unknown>,
      signature: ethers.SignatureLike,
    ): Promise<boolean>
  }
}

export function wrap<provider extends ethers.AbstractProvider>(
  provider: provider,
): Provider<provider> {
  return Object.assign(provider, {
    verifyHash: (address, digest, signature) =>
      Signature.verifyHash(provider, address, digest, signature),
    verifyMessage: (address, message, signature) =>
      Signature.verifyMessage(provider, address, message, signature),
    verifyTypedData: (address, domain, types, value, signature) =>
      Signature.verifyTypedData(
        provider,
        address,
        domain,
        types,
        value,
        signature,
      ),
  } satisfies Provider.Interface)
}
