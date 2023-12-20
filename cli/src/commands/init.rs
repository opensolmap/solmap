use std::path::PathBuf;

use anyhow::Result;
use solana_sdk::{signer::Signer, transaction::Transaction};

use crate::{commands::instructions::create_init_index_ix, setup::CliConfig};

pub struct InitArgs {
    pub keypair_path: Option<PathBuf>,
    pub rpc_url: Option<String>,
}

pub fn init(args: InitArgs) -> Result<()> {
    println!("Adding bytes to the slot index solmap number");
    let config = CliConfig::new(args.keypair_path, args.rpc_url)?;

    let ix = create_init_index_ix(config.keypair.pubkey());

    let blockhash = config.client.get_latest_blockhash()?;

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&config.keypair.pubkey()),
        &[&config.keypair],
        blockhash,
    );

    let sig = config
        .client
        .send_and_confirm_transaction_with_spinner(&tx)?;

    println!("Successful with signature {}", sig);

    Ok(())
}
