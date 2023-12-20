use std::path::PathBuf;

use crate::setup::CliConfig;
use anyhow::Result;
use bitvec::prelude::*;
use solana_program::pubkey::Pubkey;

pub struct TotalMintedArgs {
    pub keypair_path: Option<PathBuf>,
    pub rpc_url: Option<String>,
}

pub fn total_minted(args: TotalMintedArgs) -> Result<()> {
    let config = CliConfig::new(args.keypair_path, args.rpc_url)?;

    let slot_index = Pubkey::find_program_address(&[b"slot_index"], &solmap::ID).0;
    let slot_index_account = config.client.get_account(&slot_index)?;

    let slot_index_bits = slot_index_account.data.view_bits::<Lsb0>();

    // Count all the 1s in the slot index solmap
    let total_minted = slot_index_bits.count_ones();

    println!("{total_minted} solmaps have been minted");

    Ok(())
}
