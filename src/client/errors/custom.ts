export type CustomError = InvalidSolmapNumber | SolmapAlreadyMinted

export class InvalidSolmapNumber extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "InvalidSolmapNumber"
  readonly msg = "Invalid Solmap number"

  constructor(readonly logs?: string[]) {
    super("6000: Invalid Solmap number")
  }
}

export class SolmapAlreadyMinted extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "SolmapAlreadyMinted"
  readonly msg = "Solmap already minted"

  constructor(readonly logs?: string[]) {
    super("6001: Solmap already minted")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new InvalidSolmapNumber(logs)
    case 6001:
      return new SolmapAlreadyMinted(logs)
  }

  return null
}
