# ArcRadar Builder Notes

ArcRadar is a curated Arc Testnet directory. Builders cannot publish directly to
the public directory yet; the ArcRadar team adds and moderates profiles
internally so the signal board stays useful.

## What To Prepare

- Project name, short tagline, category, and current stage.
- Public proof links such as website, X, Discord, GitHub, docs, or demo.
- Arc Testnet project wallet for receiving ERC-20 USDC tips.
- A short builder note explaining why the project belongs on Arc.
- Any launch, roadmap, or hackathon context that helps visitors understand
  momentum.

## Tip Safety

- ArcRadar treats `projectId` as the curated project slug, for example `your-project-slug`.
- TipRouter events only count when the slug is already curated by ArcRadar and
  the event recipient matches the listed project wallet.
- ERC-20 USDC tips use 6 decimals. Native Arc gas uses USDC with 18 decimals.
  These are intentionally handled as separate balances.
- Testnet tips are discovery and support signals. They are not yield, rewards,
  investment returns, or mainnet claims.

## Profile Claiming

Claim UI is prepared, but public claiming is not live. A future claim flow should
use a wallet signature, admin review, and public proof links before a verified
builder badge is granted.

## Assets

Public image upload is disabled. Future logo or screenshot uploads must enforce
the ArcRadar image policy: JPG, PNG, or WebP only, 2 MB maximum, no SVG, and no
client-controlled storage path.
