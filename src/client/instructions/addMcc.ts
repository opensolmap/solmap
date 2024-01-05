import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface AddMccAccounts {
  authority: PublicKey
  mint: PublicKey
  metadata: PublicKey
  mcc: PublicKey
  collectionMetadata: PublicKey
  collectionMasterEdition: PublicKey
  fvca: PublicKey
  systemProgram: PublicKey
  sysvarInstructions: PublicKey
  tokenMetadataProgram: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
}

export function addMcc(
  accounts: AddMccAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.authority, isSigner: true, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.metadata, isSigner: false, isWritable: true },
    { pubkey: accounts.mcc, isSigner: false, isWritable: false },
    { pubkey: accounts.collectionMetadata, isSigner: false, isWritable: true },
    {
      pubkey: accounts.collectionMasterEdition,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.fvca, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.sysvarInstructions, isSigner: false, isWritable: false },
    {
      pubkey: accounts.tokenMetadataProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
  ]
  const identifier = Buffer.from([49, 245, 40, 236, 81, 188, 220, 140])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
