# Sigil

**The AI copilot for smart contract developers.**

Sigil reads Solidity, Rust and Move contracts the way an auditor does. It writes your tests, flags known exploit patterns, and simulates every call locally before you deploy.

🔗 **Website:** [sigil-website.vercel.app](https://sigil-website.vercel.app)
🐦 **X:** https://x.com/use_sigil
📬 **Early access:** [join the waitlist](https://sigil-website.vercel.app/#access)

---

## Why Sigil exists

General copilots write code that compiles. Then it gets exploited.

Smart contract bugs are not normal bugs. They cost real money, instantly and irreversibly. Sigil is built only for contracts: it is trained on the full history of published exploit post-mortems and audit findings, so the mistake that drained someone else's protocol gets caught in yours before it ships.

```
$ sigil explain 0x7a25...d4E9

[ summary ]
Lending vault. Users deposit USDC, borrow against ETH collateral.
Owner can change the oracle address.

[ risk flags ]
! liquidate() reads balance before external call.
  Matches Cream Finance reentrancy pattern (2021)
! setOracle() has no timelock.
  Owner can repoint the price feed instantly

[ simulation, local fork, read only ]
ok borrow(10 ETH) mints 14,200 USDC debt, health factor 1.31
ok repay() saves 4,120 gas if the debt mapping is packed
```

## What Sigil does

| Capability | What you get |
|---|---|
| **Explain** | Plain-English breakdown of any contract, from a file in your repo or a deployed address |
| **Exploit pattern matching** | Your code checked against every published post-mortem and audit finding |
| **Local simulation** | Fork the chain on your machine and see exactly what a call does. Read only. Nothing leaves your computer |
| **Test generation** | Full Foundry and Hardhat test suites, including the edge cases you didn't think of |
| **Gas optimization** | Line-level suggestions with the exact gas saved |
| **NatSpec and docs** | Complete documentation generated from your code |
| **Cross-chain notes** | Porting between Solidity, Rust and Move? Sigil explains what breaks and why |

## Works with

Foundry · Hardhat · Remix · Cursor · MCP

## Machine-payable by design

Every Sigil capability (`explain`, `test`, `audit`, `simulate`) is exposed as an API endpoint that AI agents can pay per call over **x402**. No API keys, no accounts. Audit pipelines, deploy bots and other copilots are customers too.

## Principles

- **Open core.** The fundamentals are open source, forever.
- **Grant-backed.** Built for the public-goods dev tooling tracks of major ecosystems.
- **No token.** Revenue comes from usage, not speculation.
- **Local first.** Simulation runs entirely on your machine and is read only. Code sent to AI features is processed transiently and never used for training.

## Status

🚧 **Early development.** This repo currently hosts the landing page. The CLI and core engine are in active development.

## Roadmap

- [x] Landing page and waitlist
- [ ] `sigil explain` CLI (contract address → summary, risk flags, simulation)
- [ ] Exploit pattern database v1 (public post-mortems + Code4rena / Sherlock findings)
- [ ] Foundry plugin
- [ ] Hardhat plugin
- [ ] x402 machine-payable API endpoints
- [ ] Cursor extension
- [ ] Rust and Move support

## Running the site locally

No build step. Clone the repo and open `index.html` in your browser, or serve it:

```bash
npx serve .
```

## Contributing

Sigil is early and we would love your input. Open an issue with ideas, bug reports, or exploit patterns you think the matcher should know about.

## License

MIT (license file coming with the first code release).

---

*Read the contract before the contract reads you.*
