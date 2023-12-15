import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface MintArgs {
  solmap: BN
}

export interface MintAccounts {
  minter: PublicKey
  slotIndex: PublicKey
  treasury: PublicKey
  mint: PublicKey
  tokenAccount: PublicKey
  metadata: PublicKey
  masterEdition: PublicKey
  fvca: PublicKey
  inscriptionV3: PublicKey
  inscriptionData: PublicKey
  inscriptionSummary: PublicKey
  inscriptionsProgram: PublicKey
  systemProgram: PublicKey
  sysvarInstructions: PublicKey
  tokenMetadataProgram: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
}

export const layout = borsh.struct([borsh.u64("solmap")])

export function mint(
  args: MintArgs,
  accounts: MintAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.minter, isSigner: true, isWritable: true },
    { pubkey: accounts.slotIndex, isSigner: false, isWritable: true },
    { pubkey: accounts.treasury, isSigner: false, isWritable: true },
    { pubkey: accounts.mint, isSigner: true, isWritable: true },
    { pubkey: accounts.tokenAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.metadata, isSigner: false, isWritable: true },
    { pubkey: accounts.masterEdition, isSigner: false, isWritable: true },
    { pubkey: accounts.fvca, isSigner: false, isWritable: false },
    { pubkey: accounts.inscriptionV3, isSigner: false, isWritable: true },
    { pubkey: accounts.inscriptionData, isSigner: false, isWritable: true },
    { pubkey: accounts.inscriptionSummary, isSigner: false, isWritable: true },
    {
      pubkey: accounts.inscriptionsProgram,
      isSigner: false,
      isWritable: false,
    },
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
  const identifier = Buffer.from([51, 57, 225, 47, 182, 146, 137, 166])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      solmap: args.solmap,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
