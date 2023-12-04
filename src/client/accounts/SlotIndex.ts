import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SlotIndexFields {}

export interface SlotIndexJSON {}

export class SlotIndex {
  static readonly discriminator = Buffer.from([
    181, 158, 126, 89, 169, 94, 138, 55,
  ])

  static readonly layout = borsh.struct([])

  constructor(fields: SlotIndexFields) {}

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<SlotIndex | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<SlotIndex | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): SlotIndex {
    if (!data.slice(0, 8).equals(SlotIndex.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = SlotIndex.layout.decode(data.slice(8))

    return new SlotIndex({})
  }

  toJSON(): SlotIndexJSON {
    return {}
  }

  static fromJSON(obj: SlotIndexJSON): SlotIndex {
    return new SlotIndex({})
  }
}
