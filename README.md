# The Open Solmap Theory

Solmaps give you the **power of digital ownership** over a plot of Solana (1000 slots) and **************************************************************freedom to build unconstrained************************************************************** in the context of a ************************************************consensus and community-driven project.************************************************

Each Solmap Inscription represents ownership of 1,000 consecutive Solana slots, allowing holders to explore on-chain data from those slots.

You will be able to own 1000 slots of solana - we call it a plot, which means if you inscribe `12345.solmap`, you will be able to own

- An NFT and an inscription of `12345.solmap`
- And, 1000 slots from 12,345,000 to 12,345,999
- The first slot 12345000 will be the main slot of the plot.

There’re so many nice properties of a solmap. Slot height is about 232M (you get 1000 slots for every single solmap). So, there will be about 232K total supply of solmap. For example, here’s a link of the explorer of the slots and blocks explanation

- https://explorer.solana.com/block/234437351

We encourage everyone to explore, build, and collaborate on the solmap theory. There are so many native solana properties of a slot / block that we can add to the solmap universe. 

- Block Attributes
- Block Txs
- Block Rewards
- Block Programs
- Block Accounts

# Simple and Open Design

- Immutable by default
- Decentralized multi-sig governance
- Simple NFT metadata
- Simple Inscription metadata
- Open invitation to generative art design, metaverse games, and much more.

# Provenance & Indexing Rules

Provenance and validation rules are validated by the open-source program of solmap.

- Every inscription is immutable
- Every inscription has the format like this `(/^(0|[1-9][0-9]*)\.solmap$`
- first-is-first rule
    - The first solmap will be the legit one. No one can mint a duplicate solmap
- The slots you own must be valid
    - At the time of minting, the slots owned by this solmap have to be valid
    - For example, when you mint 12345, which means the largest slot you own 12345999 should have already existed.

# Development

```
anchor build
anchor test
```

# Future Applications

- Metaverse games
- Generative art and data visualization
- Customized traits and rarity