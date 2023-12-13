use anchor_lang::prelude::*;

#[error_code]
pub enum SolmapError {
    #[msg("Minting is not live yet")]
    MintingNotLiveYet,

    #[msg("Invalid Solmap number")]
    InvalidSolmapNumber,

    #[msg("Solmap already minted")]
    SolmapAlreadyMinted,
}
