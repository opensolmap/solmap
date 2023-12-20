use solana_program::{pubkey, pubkey::Pubkey};

pub const TREASURY: Pubkey = pubkey!("72GEqCXZ5GLWnCWon5LBXjsZaoUh8jmarhXoBXnFr6CB");
pub const SOLMAP_PROGRAM_ID: Pubkey = pubkey!("SoLMAPutKhdpSSGpCCWioKfqqNQhsdaM8EEi41ummJM");
pub const TOKEN_METADATA_PROGRAM_ID: Pubkey =
    pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
pub const TOKEN_PROGRAM_ID: Pubkey = pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
pub const ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: Pubkey =
    pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
pub const SOLMAP_COLLECTION: Pubkey = pubkey!("7GuWX1QnSzhT2Km6UZg1prndyQfkjfBqs8vK3h4tY6n2");
pub const INSCRIPTION_PROGRAM_ID: Pubkey = pubkey!("inscokhJarcjaEs59QbQ7hYjrKz25LEPRfCbP8EmdUp");

pub const MINT_SOLMAP_DISC: [u8; 8] = [51, 57, 225, 47, 182, 146, 137, 166];
pub const INIT_INDEX_DISC: [u8; 8] = [206, 236, 58, 58, 171, 221, 237, 57];

pub const PRIORITY_FEE_RATE: u64 = 25000;
