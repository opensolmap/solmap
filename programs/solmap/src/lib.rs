use anchor_lang::{accounts::account::Account, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata,
    token::{Mint, Token},
};
use bitvec::prelude::*;
use libreplex_inscriptions::{
    cpi::accounts::{
        CreateInscriptionV3, MakeInscriptionImmutableV3, ResizeInscriptionV3, WriteToInscriptionV3,
    },
    instructions::{SignerType, WriteToInscriptionInput},
};
use mpl_token_metadata::types::{CreateArgs, Creator, MintArgs, TokenStandard};
use mpl_token_metadata::{
    instructions::{CreateCpiBuilder, MintCpiBuilder},
    types::PrintSupply,
};
use solana_program::{
    program::invoke,
    system_instruction,
    sysvar::{instructions::Instructions, SysvarId},
    {pubkey, pubkey::Pubkey},
};

mod error;
mod utils;
use utils::{create_or_allocate_account_raw, resize_or_reallocate_account_raw};

use crate::error::SolmapError;

declare_id!("9iSon7JwYNRF5UuCgvwucFRDSPGxLFuNCghr56q5khwR");

const COMMUNITY_GRANT_FEE: u64 = 50_000_000; // 0.05 SOL
const COMMUNITY_TREASURY: Pubkey = pubkey!("moar8bV9AjnbMMF9xZ6LYV6BUwZHiepGciWDfVUT9uX");

const SOLMAP_URI: &str = "https://arweave.net/KtjcXOfeTK0RnUtLuVNBBtPG6iXH4ySncYEW-bl-NHk";
const INSCRIPTION_PROGRAM_ID: Pubkey = pubkey!("inscokhJarcjaEs59QbQ7hYjrKz25LEPRfCbP8EmdUp");

const GO_LIVE_DATE: i64 = if cfg!(feature = "anchor-test") {
    0 // Always live for tests.
} else {
    1703062800 // 2023-12-20T00:00:00Z
};

#[program]
pub mod solmap {
    use super::*;

    pub fn init_index(ctx: Context<InitIndex>) -> Result<()> {
        if ctx.accounts.slot_index.data_is_empty() {
            let bump = ctx.bumps.slot_index;
            msg!("Initializing slot index account");
            create_or_allocate_account_raw(
                crate::ID,
                &ctx.accounts.slot_index,
                &ctx.accounts.system_program,
                &ctx.accounts.payer,
                10240,
                &[b"slot_index", &[bump]],
            )?;
        } else {
            let current_len = ctx.accounts.slot_index.data_len();
            msg!("Resizing slot index account");
            resize_or_reallocate_account_raw(
                &ctx.accounts.slot_index,
                &ctx.accounts.payer,
                &ctx.accounts.system_program,
                current_len + 10240,
            )?;
        }

        Ok(())
    }

    pub fn mint(ctx: Context<MintSolmap>, solmap: u64) -> Result<()> {
        mint_handler(ctx, solmap)
    }
}

#[rustfmt::skip]
#[derive(Accounts)]
pub struct InitIndex<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: seeds check here and a new account is created.
    #[account(
        mut,
        seeds = ["slot_index".as_bytes()], bump,
    )]
    pub slot_index: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[rustfmt::skip]
#[derive(Accounts)]
pub struct MintSolmap<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,

    /// CHECK: seeds check here
    #[account(mut, seeds = ["slot_index".as_bytes()], bump)]
    pub slot_index: UncheckedAccount<'info>,

    /// CHECK: Address check here
    #[account(mut, address = COMMUNITY_TREASURY)]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = minter,
        mint::decimals = 0,
        mint::freeze_authority = minter,
        mint::authority = minter
    )]    
    pub mint: Account<'info, Mint>,

    /// CHECK: seeds check here, Token Metadata provides the rest of validations
    #[account(mut,
        seeds = [
            minter.key().as_ref(),
            token_program.key().as_ref(),
            mint.key().as_ref()
        ],
        bump,
        seeds::program = associated_token_program.key(),
    )]
    pub token_account: UncheckedAccount<'info>,

    /// CHECK: seeds check here, Token Metadata provides the rest of validations
    #[account(mut, 
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = Metadata::id(),
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: seeds check here, Token Metadata provides the rest of validations
    #[account(mut, 
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            mint.key().as_ref(),
            b"edition",
        ],
        bump,
        seeds::program = Metadata::id(),
    )]
    pub master_edition: UncheckedAccount<'info>,

    // Used to tie all Solmap NFTs together in a collection.
    /// CHECK: Address checked here
    #[account( 
        seeds = ["fvca".as_bytes()],
        bump
    )]
    pub fvca: UncheckedAccount<'info>,
    
    /// CHECK: Validated by inscriptions program
    #[account(mut)]
    pub inscription_v3: UncheckedAccount<'info>,
    
    /// CHECK: Validated by inscriptions program
    #[account(mut)]
    pub inscription_data: UncheckedAccount<'info>,
    
    /// CHECK: seed check here and validation in inscription program
    #[account(mut, 
        seeds = ["inscription_summary".as_bytes()],
        bump,
        seeds::program = INSCRIPTION_PROGRAM_ID,
    )]
    pub inscription_summary: UncheckedAccount<'info>,

    /// CHECK: address checked here
    /// CHECK: address checked here
    #[account(address = INSCRIPTION_PROGRAM_ID)]
    pub inscriptions_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: address contraints check here
    #[account(address = Instructions::id())]
    pub sysvar_instructions: UncheckedAccount<'info>,

    /// CHECK: address checked here
    #[account(address = Metadata::id())]
    pub token_metadata_program: UncheckedAccount<'info>,

    #[account()]
    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn mint_handler(ctx: Context<MintSolmap>, solmap_number: u64) -> Result<()> {
    // GO LIVE DATE CHECK
    let clock = Clock::get()?;
    if clock.unix_timestamp < GO_LIVE_DATE {
        return Err(SolmapError::MintingNotLiveYet.into());
    }

    msg!("Minting Solmap #{:?}", solmap_number);
    let fvca = &ctx.accounts.fvca;

    let inscription_v3 = &ctx.accounts.inscription_v3;
    let inscription_data = &ctx.accounts.inscription_data;
    let inscription_summary = &ctx.accounts.inscription_summary;

    let minter = &ctx.accounts.minter;
    let mint = &ctx.accounts.mint;
    let token_account = &ctx.accounts.token_account;
    let metadata = &ctx.accounts.metadata;
    let master_edition = &ctx.accounts.master_edition;

    let sysvar_instructions = &ctx.accounts.sysvar_instructions;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let associated_token_program = &ctx.accounts.associated_token_program;
    let inscriptions_program = &ctx.accounts.inscriptions_program;

    let solmap_string = format!("{solmap_number}.solmap");
    let solmap_bytes = solmap_string.as_bytes();

    // Solmap validations

    // Slots are stored in the slot index account as a bit array.
    // 1 means minted, 0 means not minted.

    // Slot must already exist.
    let current_slot = clock.slot;
    if (solmap_number + 1) * 1000 > current_slot {
        return Err(SolmapError::InvalidSolmapNumber.into());
    }

    // Slot cannot be minted already. We track minted slots as 1s in the slot index account.
    let slot_index = &mut ctx.accounts.slot_index.data.borrow_mut();
    let slot_index_bits = slot_index.view_bits_mut::<Lsb0>();

    let mut slot_index_bit = slot_index_bits.get_mut(solmap_number as usize).unwrap();

    if *slot_index_bit {
        return Err(SolmapError::SolmapAlreadyMinted.into());
    } else {
        *slot_index_bit = true;
    }

    // Create mint and ATA.
    let create_args = CreateArgs::V1 {
        name: solmap_string.clone(),
        symbol: "SOLMAP".to_string(),
        uri: SOLMAP_URI.to_string(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: fvca.key(),
            verified: true,
            share: 100,
        }]),
        primary_sale_happened: true,
        is_mutable: true,
        token_standard: TokenStandard::NonFungible,
        collection: None,
        uses: None,
        collection_details: None,
        rule_set: None,
        decimals: None,
        print_supply: Some(PrintSupply::Zero),
    };

    let fvca_seeds = &[b"fvca".as_ref(), &[ctx.bumps.fvca]];

    let mut create_builder = CreateCpiBuilder::new(&ctx.accounts.token_metadata_program);
    create_builder
        .payer(minter)
        .metadata(metadata)
        .master_edition(Some(master_edition))
        .mint(&mint.to_account_info(), true)
        .authority(minter)
        .update_authority(fvca, true)
        .system_program(system_program)
        .spl_token_program(token_program)
        .sysvar_instructions(sysvar_instructions)
        .create_args(create_args)
        .invoke_signed(&[fvca_seeds])?;

    // Mint token.
    let mint_args = MintArgs::V1 {
        amount: 1,
        authorization_data: None,
    };

    let mut mint_builder = MintCpiBuilder::new(&ctx.accounts.token_metadata_program);
    mint_builder
        .token(token_account)
        .token_owner(Some(minter))
        .metadata(metadata)
        .master_edition(Some(master_edition))
        .mint(&mint.to_account_info())
        .authority(fvca)
        .payer(minter)
        .system_program(system_program)
        .spl_token_program(token_program)
        .spl_ata_program(associated_token_program)
        .sysvar_instructions(sysvar_instructions)
        .mint_args(mint_args)
        .invoke_signed(&[fvca_seeds])?;

    // Create inscription.
    libreplex_inscriptions::cpi::create_inscription_v3(
        CpiContext::new(
            ctx.accounts.inscriptions_program.to_account_info(),
            CreateInscriptionV3 {
                /* the inscription root is set to metaplex
                    inscription object.
                */
                inscription_summary: inscription_summary.to_account_info(),

                root: mint.to_account_info(),
                // since root in this case can sign (we are creating a brand new mint),
                // it will sign
                signer: mint.to_account_info(),
                inscription_v3: inscription_v3.to_account_info(),

                system_program: system_program.to_account_info(),
                payer: ctx.accounts.minter.to_account_info(),
                inscription_data: inscription_data.to_account_info(),
            },
        ),
        libreplex_inscriptions::instructions::CreateInscriptionInputV3 {
            authority: Some(minter.key()), // this includes update auth / holder, hence
            signer_type: SignerType::Root,
            validation_hash: None,
        },
    )?;

    // Resize inscription data account.
    libreplex_inscriptions::cpi::resize_inscription_v3(
        CpiContext::new(
            inscriptions_program.to_account_info(),
            ResizeInscriptionV3 {
                /* the inscription root is set to metaplex
                 inscription object.
                */
                authority: minter.to_account_info(),

                system_program: system_program.to_account_info(),
                payer: minter.to_account_info(),
                inscription_data: inscription_data.to_account_info(),
                inscription_v3: inscription_v3.to_account_info(),
            },
        ),
        libreplex_inscriptions::instructions::ResizeInscriptionInput {
            change: solmap_bytes.len() as i32 - 8,
            expected_start_size: 8,
            target_size: solmap_bytes.len() as u32,
        },
    )?;

    // Write inscription data.
    libreplex_inscriptions::cpi::write_to_inscription_v3(
        CpiContext::new(
            inscriptions_program.to_account_info(),
            WriteToInscriptionV3 {
                authority: minter.to_account_info(),
                payer: minter.to_account_info(),
                inscription_v3: inscription_v3.to_account_info(),
                system_program: system_program.to_account_info(),
                inscription_data: inscription_data.to_account_info(),
            },
        ),
        WriteToInscriptionInput {
            data: solmap_bytes.to_vec(),
            start_pos: 0,
            media_type: Some("text/plain".to_owned()),
            encoding_type: Some("ascii".to_owned()),
        },
    )?;

    // Make inscription immutable.
    libreplex_inscriptions::cpi::make_inscription_immutable_v3(CpiContext::new(
        inscriptions_program.to_account_info(),
        MakeInscriptionImmutableV3 {
            payer: minter.to_account_info(),
            authority: minter.to_account_info(),
            inscription_summary: inscription_summary.to_account_info(),
            inscription_v3: inscription_v3.to_account_info(),
            system_program: system_program.to_account_info(),
        },
    ))?;

    // Pay community treasury to fund project grants.
    invoke(
        &system_instruction::transfer(
            ctx.accounts.minter.key,
            ctx.accounts.treasury.key,
            COMMUNITY_GRANT_FEE,
        ),
        &[
            ctx.accounts.minter.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
        ],
    )?;

    Ok(())
}
