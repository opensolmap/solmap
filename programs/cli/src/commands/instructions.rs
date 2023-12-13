use metaboss_lib::derive::*;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program, sysvar,
};

use crate::constants::*;

pub fn create_init_index_ix(payer: Pubkey) -> Instruction {
    let data = INIT_INDEX_DISC.to_vec();

    let index = Pubkey::find_program_address(&["slot_index".as_ref()], &SOLMAP_PROGRAM_ID).0;

    Instruction {
        program_id: SOLMAP_PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(payer, true),
            AccountMeta::new(index, false),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data,
    }
}

pub fn create_mint_solmap_ix(authority: Pubkey, mint: Pubkey, solmap_number: u64) -> Instruction {
    let mut data = MINT_SOLMAP_DISC.to_vec();
    data.extend(solmap_number.to_le_bytes());

    let metadata = derive_metadata_pda(&mint);
    let master_edition = derive_edition_pda(&mint);
    let token = Pubkey::find_program_address(
        &[authority.as_ref(), TOKEN_PROGRAM_ID.as_ref(), mint.as_ref()],
        &ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    )
    .0;

    let fvca = Pubkey::find_program_address(&["fvca".as_bytes()], &SOLMAP_PROGRAM_ID).0;

    let inscription_summary = find_inscription_summary_key();
    let (inscription_ranks_current_page, inscription_ranks_next_page) =
        find_inscription_rank_pages();
    let inscription = find_inscription_key(mint);
    let inscription_v3 = find_inscription_v3_key(mint);
    let inscription_data = find_inscription_data_key(mint);

    Instruction {
        program_id: SOLMAP_PROGRAM_ID,
        accounts: vec![
            AccountMeta::new(authority, true),
            AccountMeta::new(SLOT_INDEX, false),
            AccountMeta::new(TREASURY, false),
            AccountMeta::new(mint, true),
            AccountMeta::new(token, false),
            AccountMeta::new(metadata, false),
            AccountMeta::new(master_edition, false),
            AccountMeta::new_readonly(fvca, false),
            AccountMeta::new(inscription, false),
            AccountMeta::new(inscription_v3, false),
            AccountMeta::new(inscription_data, false),
            AccountMeta::new(inscription_ranks_current_page, false),
            AccountMeta::new(inscription_ranks_next_page, false),
            AccountMeta::new(inscription_summary, false),
            AccountMeta::new_readonly(INSCRIPTION_PROGRAM_ID, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(sysvar::instructions::ID, false),
            AccountMeta::new_readonly(TOKEN_METADATA_PROGRAM_ID, false),
            AccountMeta::new_readonly(TOKEN_PROGRAM_ID, false),
            AccountMeta::new_readonly(ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, false),
        ],
        data,
    }
}

fn find_inscription_summary_key() -> Pubkey {
    let (pubkey, _) =
        Pubkey::find_program_address(&[b"inscription_summary"], &INSCRIPTION_PROGRAM_ID);
    pubkey
}

fn find_inscription_rank_pages() -> (Pubkey, Pubkey) {
    let (current_page, _) = Pubkey::find_program_address(
        &[b"inscription_rank", &[0, 0, 0, 0]],
        &INSCRIPTION_PROGRAM_ID,
    );
    let (next_page, _) = Pubkey::find_program_address(
        &[b"inscription_rank", &[1, 0, 0, 0]],
        &INSCRIPTION_PROGRAM_ID,
    );
    (current_page, next_page)
}

fn find_inscription_key(mint: Pubkey) -> Pubkey {
    let (key, _) =
        Pubkey::find_program_address(&[b"inscription", &mint.to_bytes()], &INSCRIPTION_PROGRAM_ID);
    key
}

fn find_inscription_v3_key(mint: Pubkey) -> Pubkey {
    let (key, _) = Pubkey::find_program_address(
        &[b"inscription_v3", &mint.to_bytes()],
        &INSCRIPTION_PROGRAM_ID,
    );
    key
}

fn find_inscription_data_key(mint: Pubkey) -> Pubkey {
    let (key, _) = Pubkey::find_program_address(
        &[b"inscription_data", &mint.to_bytes()],
        &INSCRIPTION_PROGRAM_ID,
    );
    key
}
