use std::path::PathBuf;

use crate::setup::CliConfig;
use anyhow::Result;
use bitvec::prelude::*;
use solana_program::pubkey::Pubkey;

pub struct CheckArgs {
    pub keypair_path: Option<PathBuf>,
    pub rpc_url: Option<String>,
    pub solmap_number: u64,
}

pub fn check_if_minted(args: CheckArgs) -> Result<()> {
    let config = CliConfig::new(args.keypair_path, args.rpc_url)?;

    let slot_index = Pubkey::find_program_address(&[b"slot_index"], &solmap::ID).0;
    let slot_index_account = config.client.get_account(&slot_index)?;

    let slot_index_bits = slot_index_account.data.view_bits::<Lsb0>();

    let slot_index_bit = slot_index_bits
        .get(args.solmap_number as usize)
        .ok_or_else(|| {
            anyhow::anyhow!(
                "Solmap number {} is out of range for the current slot",
                args.solmap_number
            )
        })?;

    let msg = format!("Solmap number {} is", args.solmap_number);
    if !slot_index_bit {
        println!("{msg} not minted");
    } else {
        println!("{msg} minted");
    }
    Ok(())
}
