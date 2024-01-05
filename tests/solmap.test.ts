import * as anchor from "@coral-xyz/anchor";
import {
  BorshAccountsCoder,
  Idl,
  Program,
  ProgramError
} from "@coral-xyz/anchor";
import { Solmap } from "../target/types/solmap";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import { assert, expect } from "chai";
import { sha256 } from "@noble/hashes/sha256";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createAndMint,
  fetchMetadata,
  mplTokenMetadata,
  updateV1
} from "@metaplex-foundation/mpl-token-metadata";

import tokenMetadata from "../token_metadata.json";
import testKeypair from "./test_keypair.json";
import testMcc from "./test_mcc.json";
import {
  createSignerFromKeypair,
  generatedSignerIdentity,
  publicKey,
  sol
} from "@metaplex-foundation/umi";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const INSCRIPTION_PROGRAM_ID = new PublicKey(
  "inscokhJarcjaEs59QbQ7hYjrKz25LEPRfCbP8EmdUp"
);
const TREASURY = new PublicKey("72GEqCXZ5GLWnCWon5LBXjsZaoUh8jmarhXoBXnFr6CB");
const SOLMAP_URI =
  "https://arweave.net/o8sskjgVX80gn27pHPp_Q9DlCbIP8twSrHMwzLvm2ZI";

describe("solmap", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const umi = createUmi("http://localhost:8899")
    .use(mplTokenMetadata())
    .use(generatedSignerIdentity());

  const connection = new Connection("http://localhost:8899", "confirmed");

  const program = anchor.workspace.Solmap as Program<Solmap>;

  const payer = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKeypair));

  const tokenMetadataIdl: Idl = tokenMetadata as Idl;
  const tmCoder = new BorshAccountsCoder(tokenMetadataIdl);

  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000
  });

  // These don't change between tests and can be reused.
  const slotIndex = PublicKey.findProgramAddressSync(
    [Buffer.from("slot_index")],
    program.programId
  )[0];
  const fvca = PublicKey.findProgramAddressSync(
    [Buffer.from("fvca")],
    program.programId
  )[0];

  const mcc = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testMcc));
  const mccKeypair = umi.eddsa.createKeypairFromSecretKey(mcc.secretKey);
  const mccMetadata = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mcc.publicKey.toBuffer()
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
  const mccMasterEdition = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mcc.publicKey.toBuffer(),
      Buffer.from("edition")
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];

  before(async () => {
    await connection.requestAirdrop(payer.publicKey, 1000000000);
    await connection.requestAirdrop(program.provider.publicKey, 1000000000);
    await umi.rpc.airdrop(umi.payer.publicKey, sol(1));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await program.methods
      .initIndex()
      .accounts({
        payer: payer.publicKey,
        slotIndex,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([payer])
      .rpc({
        skipPreflight: true
      });

    // Mint MCC NFT
    await createAndMint(umi, {
      metadata: publicKey(mccMetadata),
      masterEdition: publicKey(mccMasterEdition),
      mint: createSignerFromKeypair(umi, mccKeypair),
      payer: umi.payer,
      authority: umi.payer,
      systemProgram: publicKey(anchor.web3.SystemProgram.programId),
      sysvarInstructions: publicKey(anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY),
      splTokenProgram: publicKey(TOKEN_PROGRAM_ID),
      name: "collection.solmap",
      uri: SOLMAP_URI,
      creators: null,
      sellerFeeBasisPoints: {
        basisPoints: BigInt(0),
        identifier: "%",
        decimals: 2
      },
      tokenStandard: 0
    }).sendAndConfirm(umi);

    await updateV1(umi, {
      authority: umi.payer,
      delegateRecord: null,
      token: null,
      mint: mccKeypair.publicKey,
      metadata: publicKey(mccMetadata),
      edition: publicKey(mccMasterEdition),
      payer: umi.payer,
      systemProgram: publicKey(anchor.web3.SystemProgram.programId),
      sysvarInstructions: publicKey(anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY),
      authorizationRulesProgram: null,
      authorizationRules: null,
      newUpdateAuthority: publicKey(fvca)
    }).sendAndConfirm(umi);

    const mccNft = await fetchMetadata(umi, publicKey(mccMetadata));
    expect(mccNft.name).to.equal("collection.solmap");
  });

  const inscriptionSummary = findInscriptionSummaryKey();
  const [inscriptionRanksCurrentPage, inscriptionRanksNextPage] =
    findInscriptionRankPages();

  let mint: Keypair;
  let metadata: PublicKey;
  let masterEdition: PublicKey;
  let tokenAccount: PublicKey;
  let inscriptionV3: PublicKey;
  let inscriptionData: PublicKey;

  beforeEach(async () => {
    mint = anchor.web3.Keypair.generate();

    // Token Metadata Accounts
    metadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    masterEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    tokenAccount = PublicKey.findProgramAddressSync(
      [
        payer.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer()
      ],
      ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )[0];

    // Inscription Accounts
    inscriptionV3 = findInscriptionV3Key(mint.publicKey);
    inscriptionData = findInscriptionDataKey(mint.publicKey);
  });

  it("Mints a Metaplex NFT and inscribes it", async () => {
    const solmapNum = new anchor.BN(0);

    const tx = await program.methods
      .mint(solmapNum)
      .preInstructions([computeBudgetIx])
      .accounts({
        minter: payer.publicKey,
        slotIndex,
        treasury: TREASURY,
        mint: mint.publicKey,
        tokenAccount,
        metadata,
        masterEdition,
        fvca,
        mcc: mcc.publicKey,
        collectionMetadata: mccMetadata,
        collectionMasterEdition: mccMasterEdition,
        inscriptionV3,
        inscriptionData,
        inscriptionSummary,
        inscriptionsProgram: INSCRIPTION_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      })
      .signers([payer, mint])
      .rpc({
        skipPreflight: true
      });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check that accounts were created.
    const mintAccount = await connection.getAccountInfo(mint.publicKey);
    const metadataAccount = await connection.getAccountInfo(metadata);
    const inscriptionV3Account = await connection.getAccountInfo(inscriptionV3);
    const inscriptionDataAccount = await connection.getAccountInfo(
      inscriptionData
    );

    // Accounts were created.
    expect(mintAccount).to.not.be.null;
    expect(metadataAccount).to.not.be.null;
    expect(inscriptionV3Account).to.not.be.null;
    expect(inscriptionDataAccount).to.not.be.null;

    // Metadata is correct.
    // Prepend the discriminator to get the coder to decode.
    const mdDisc = Buffer.from(sha256("account:Metadata")).slice(0, 8);
    metadataAccount.data = Buffer.concat([mdDisc, metadataAccount.data]);

    const solmap = `${solmapNum}.solmap`;

    const metadataStruct = tmCoder.decode("Metadata", metadataAccount.data);
    expect(metadataStruct.data.name.replace(/\0/g, "")).to.equal(solmap);
    expect(metadataStruct.data.symbol.replace(/\0/g, "")).to.equal("SOLMAP");
    expect(metadataStruct.data.creators[0].address.toString()).to.equal(
      fvca.toString()
    );
    expect(metadataStruct.data.creators[0].verified).to.equal(true);
    expect(metadataStruct.isMutable).to.equal(true);

    // Inscription data is correct.
    expect(inscriptionDataAccount.data).to.deep.equal(
      Buffer.from(solmap, "binary")
    );

    // Inscription is immutable (authority is set to system program).
    expect(inscriptionV3Account.data.slice(8, 40)).to.deep.equal(
      Buffer.alloc(32, 0)
    );
  });

  it("cannot mint a Solmap for a future slot", async () => {
    // Slot 100,000 should be well in the future.
    const solmapNum = new anchor.BN(100);

    try {
      await program.methods
        .mint(solmapNum)
        .preInstructions([computeBudgetIx])
        .accounts({
          minter: payer.publicKey,
          slotIndex,
          treasury: TREASURY,
          mint: mint.publicKey,
          tokenAccount,
          metadata,
          masterEdition,
          mcc: mcc.publicKey,
          collectionMetadata: mccMetadata,
          collectionMasterEdition: mccMasterEdition,
          fvca,
          inscriptionV3,
          inscriptionData,
          inscriptionSummary,
          inscriptionsProgram: INSCRIPTION_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        })
        .signers([payer, mint])
        .rpc({
          skipPreflight: true // Skip preflight to get the nicer ProgramError.
        });

      assert.fail();
    } catch (_err) {
      assert.isTrue(_err instanceof ProgramError);
      const err: ProgramError = _err;
      expect(err.code).to.equal(6001);
      expect(err.msg).to.equal("Invalid Solmap number");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that accounts were not created.
    const mintAccount = await connection.getAccountInfo(mint.publicKey);
    const metadataAccount = await connection.getAccountInfo(metadata);
    const inscriptionV3Account = await connection.getAccountInfo(inscriptionV3);
    const inscriptionDataAccount = await connection.getAccountInfo(
      inscriptionData
    );

    // Accounts were not created.
    expect(mintAccount).to.be.null;
    expect(metadataAccount).to.be.null;
    expect(inscriptionV3Account).to.be.null;
    expect(inscriptionDataAccount).to.be.null;
  });

  it("cannot mint an existing Solmap", async () => {
    // Mint a Solmap
    const solmapNum = new anchor.BN(1);

    const tx = await program.methods
      .mint(solmapNum)
      .preInstructions([computeBudgetIx])
      .accounts({
        minter: payer.publicKey,
        slotIndex,
        treasury: TREASURY,
        mint: mint.publicKey,
        tokenAccount,
        metadata,
        masterEdition,
        mcc: mcc.publicKey,
        collectionMetadata: mccMetadata,
        collectionMasterEdition: mccMasterEdition,
        fvca,
        inscriptionV3,
        inscriptionData,
        inscriptionSummary,
        inscriptionsProgram: INSCRIPTION_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      })
      .signers([payer, mint])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch accounts.
    const mintAccount = await connection.getAccountInfo(mint.publicKey);
    const metadataAccount = await connection.getAccountInfo(metadata);
    const inscriptionV3Account = await connection.getAccountInfo(inscriptionV3);
    const inscriptionDataAccount = await connection.getAccountInfo(
      inscriptionData
    );

    // Accounts were created.
    expect(mintAccount).to.not.be.null;
    expect(metadataAccount).to.not.be.null;
    expect(inscriptionV3Account).to.not.be.null;
    expect(inscriptionDataAccount).to.not.be.null;

    // Attempt to mint the same Solmap again with a different NFT.
    const secondMint = anchor.web3.Keypair.generate();

    // Token Metadata Accounts
    const secondMetadata = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        secondMint.publicKey.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    const secondMasterEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        secondMint.publicKey.toBuffer(),
        Buffer.from("edition")
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    const secondTokenAccount = PublicKey.findProgramAddressSync(
      [
        payer.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        secondMint.publicKey.toBuffer()
      ],
      ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )[0];

    // Inscription Accounts
    const secondInscription = findInscriptionKey(secondMint.publicKey);
    const secondInscriptionV3 = findInscriptionV3Key(secondMint.publicKey);
    const secondInscriptionData = findInscriptionDataKey(secondMint.publicKey);

    // Attempt to mint the same Solmap number again.
    try {
      await program.methods
        .mint(solmapNum)
        .preInstructions([computeBudgetIx])
        .accounts({
          minter: payer.publicKey,
          slotIndex,
          treasury: TREASURY,
          mint: secondMint.publicKey,
          tokenAccount: secondTokenAccount,
          metadata: secondMetadata,
          masterEdition: secondMasterEdition,
          mcc: mcc.publicKey,
          collectionMetadata: mccMetadata,
          collectionMasterEdition: mccMasterEdition,
          fvca,
          inscriptionV3: secondInscriptionV3,
          inscriptionData: secondInscriptionData,
          inscriptionSummary,
          inscriptionsProgram: INSCRIPTION_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        })
        .signers([payer, secondMint])
        .rpc({
          skipPreflight: true // Skip preflight to get the nicer ProgramError.
        });

      assert.fail();
    } catch (_err) {
      assert.isTrue(_err instanceof ProgramError);
      const err: ProgramError = _err;
      expect(err.code).to.equal(6002);
      expect(err.msg).to.equal("Solmap already minted");
    }
  });

  it("can update a NFT with a MCC ID", async () => {
    const solmapNum = new anchor.BN(2);

    // Mint a Solmap
    await program.methods
      .mint(solmapNum)
      .preInstructions([computeBudgetIx])
      .accounts({
        minter: payer.publicKey,
        slotIndex,
        treasury: TREASURY,
        mint: mint.publicKey,
        tokenAccount,
        metadata,
        masterEdition,
        mcc: mcc.publicKey,
        collectionMetadata: mccMetadata,
        collectionMasterEdition: mccMasterEdition,
        fvca,
        inscriptionV3,
        inscriptionData,
        inscriptionSummary,
        inscriptionsProgram: INSCRIPTION_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      })
      .signers([payer, mint])
      .rpc({
        skipPreflight: true
      });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that accounts were created.
    const mintAccount = await connection.getAccountInfo(mint.publicKey);
    const metadataAccount = await connection.getAccountInfo(metadata);
    const inscriptionV3Account = await connection.getAccountInfo(inscriptionV3);
    const inscriptionDataAccount = await connection.getAccountInfo(
      inscriptionData
    );

    // Accounts were created.
    expect(mintAccount).to.not.be.null;
    expect(metadataAccount).to.not.be.null;
    expect(inscriptionV3Account).to.not.be.null;
    expect(inscriptionDataAccount).to.not.be.null;

    // Metadata is correct.
    // Prepend the discriminator to get the coder to decode.
    const mdDisc = Buffer.from(sha256("account:Metadata")).slice(0, 8);
    metadataAccount.data = Buffer.concat([mdDisc, metadataAccount.data]);

    const solmap = `${solmapNum}.solmap`;

    const metadataStruct = tmCoder.decode("Metadata", metadataAccount.data);
    expect(metadataStruct.data.name.replace(/\0/g, "")).to.equal(solmap);
    expect(metadataStruct.data.symbol.replace(/\0/g, "")).to.equal("SOLMAP");
    expect(metadataStruct.data.creators[0].address.toString()).to.equal(
      fvca.toString()
    );
    expect(metadataStruct.data.creators[0].verified).to.equal(true);
    expect(metadataStruct.isMutable).to.equal(true);

    // Inscription data is correct.
    expect(inscriptionDataAccount.data).to.deep.equal(
      Buffer.from(solmap, "binary")
    );

    // Inscription is immutable (authority is set to system program).
    expect(inscriptionV3Account.data.slice(8, 40)).to.deep.equal(
      Buffer.alloc(32, 0)
    );

    await program.methods
      .addMcc()
      .accounts({
        authority: payer.publicKey,
        mint: mint.publicKey,
        metadata,
        mcc: mcc.publicKey,
        collectionMetadata: mccMetadata,
        collectionMasterEdition: mccMasterEdition,
        fvca,
        systemProgram: anchor.web3.SystemProgram.programId,
        sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
      })
      .signers([payer])
      .rpc({
        skipPreflight: true
      });
  });
});

function findInscriptionSummaryKey(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("inscription_summary")],
    INSCRIPTION_PROGRAM_ID
  )[0];
}

function findInscriptionRankPages(): [PublicKey, PublicKey] {
  const currentPage = PublicKey.findProgramAddressSync(
    [Buffer.from("inscription_rank"), Buffer.from([0, 0, 0, 0])],
    INSCRIPTION_PROGRAM_ID
  )[0];
  const nextPage = PublicKey.findProgramAddressSync(
    [Buffer.from("inscription_rank"), Buffer.from([1, 0, 0, 0])],
    INSCRIPTION_PROGRAM_ID
  )[0];
  return [currentPage, nextPage];
}

function findInscriptionKey(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("inscription"), mint.toBuffer()],
    INSCRIPTION_PROGRAM_ID
  )[0];
}

function findInscriptionV3Key(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("inscription_v3"), mint.toBuffer()],
    INSCRIPTION_PROGRAM_ID
  )[0];
}

function findInscriptionDataKey(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("inscription_data"), mint.toBuffer()],
    INSCRIPTION_PROGRAM_ID
  )[0];
}
