# The Open Solmap Theory

Solmaps give you the power of digital ownership over 1,000 consecutive Solana slots, allowing you to explore on-chain data and build unconstrained ownership within a consensus-driven community project.  

Each Solmap inscription represents ownership of 1,000 sequential Solana slots. For example, if you inscribe `12345.solmap`, you will own:

- An NFT and an inscription representing `12345.solmap`
- The 1,000 Solana slots from `12345000` to `12345999` (12345 * 1000)
- Slot `12345000` will be the main slot for the plot

With about 232 million slots total, there can be around 232,000 Solmap inscriptions so far. This provides ample room for exploration and creation.

We encourage everyone to build, collaborate, and tap into the native properties of Solana slots and blocks by adding layers and meanings. Potential areas to build on top of Solmaps include:

- Block attributes
- Block transactions
- Block rewards 
- Block programs
- Block accounts

# Key Principles

**Simple and Open Design**

- Immutable inscriptions  
- Decentralized multi-signature governance
- Simple NFT and inscription metadata
- Open ecosystem for generative art, games, etc.

**Provenance & Indexing Rules**

Validity and scarcity are enforced by the Solmap onchain program, arbitrary inscription content will not be indexed.

- Inscriptions are immutable
- Strict formatting validation via onchain program
- First-inscription-is-valid rule via onchain program
- Slots must be valid at time of minting. As long as the slot like `232000999` exists, one can mint `232000.solmap`

# Future Possibilities 

- Metaverse games
- Generative art  
- Customized traits and rarity

# Development

```
anchor build
anchor test
```

# CLI

Install on Linux or Mac with:

bash <(curl -sSf https://raw.githubusercontent.com/opensolmap/solmap/main/scripts/install.sh)

## Check if a Solmap is minted

```bash
solmap check 12345
```

## Mint a Solmap

```bash
solmap mint 12345
```

## Boost

If transactions are not going through due to high mint demand, you can pay a small additional fee to boost your transaction.

```bash
solmap mint 12345 --boost
```
