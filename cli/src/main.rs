use anyhow::Result;
use clap::Parser;

use solmap_cli::{
    args::{Args, Commands},
    commands::{check_if_minted, mint, CheckArgs, MintArgs},
};

fn main() -> Result<()> {
    solana_logger::setup_with_default("solana=info");

    let args = Args::parse();

    let keypair_path = args.keypair_path.clone();
    let rpc_url = args.rpc_url.clone();

    match args.command {
        Commands::CheckMinted { solmap } => check_if_minted(CheckArgs {
            keypair_path,
            rpc_url,
            solmap_number: solmap,
        }),
        Commands::Mint { solmap, boost } => mint(MintArgs {
            keypair_path,
            rpc_url,
            solmap_number: solmap,
            boost,
        }),
    }
}
