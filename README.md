<div align="center">

# SIGIL

**The AI copilot for smart contract developers.**

Sigil reads Solidity, Rust and Move contracts the way an auditor does: it explains
them in plain English, flags known exploit patterns tied to real incidents, and
simulates calls locally before you deploy.

[Live site](https://sigil-website.vercel.app) ·
[Try it now](https://sigil-website.vercel.app/try) ·
[Blog](https://sigil-website.vercel.app/blog) ·
[Docs](https://sigil-website.vercel.app/docs)

`Solidity` · `Rust` · `Move` · open source · no token

</div>

---

## The problem

General AI copilots write Solidity that compiles. Then it gets exploited.

Smart contract bugs are not normal bugs. They cost real money, instantly and
irreversibly. Sigil is built only for contracts. It is backed by a database of
published exploit patterns, so the mistake that drained someone else's protocol
gets caught in yours before it ships.

```
$ sigil explain 0x7a25...d4E9

[ summary ]
Lending vault. Users deposit USDC, borrow against ETH collateral.
The owner can change the price oracle at any time.

[ risk flags ]
! [high]   Value transfer before state update
           Classic reentrancy shape. see: Cream Finance (2021)
! [medium] Owner can change the oracle instantly
           No timelock on setOracle().

[ gas notes ]
ok Packing the debt mapping saves ~4,120 gas per repay()
```

---

## What Sigil does

| Capability | What you get |
|---|---|
| **Explain** | Plain-English breakdown of any contract, from a repo file or a deployed address |
| **Exploit pattern matching** | Code checked against a database of real exploit shapes, each tied to an incident |
| **Local simulation** | Fork the chain on your machine and see what a call does. Read only. Nothing leaves your computer |
| **Test generation** | Full Foundry and Hardhat suites, including edge cases |
| **Gas optimization** | Line-level suggestions with the exact gas saved |
| **NatSpec and docs** | Documentation generated from your code |
| **Cross-chain notes** | What breaks when porting between Solidity, Rust and Move |

**Works with:** Foundry · Hardhat · Remix · Cursor · MCP

---

## How it works

```
  user pastes an address or file
            |
            v
  1. FETCH    verified source is fetched (Sourcify, then Etherscan)
            v
  2. SCAN     the source is checked against every pattern in the
            |    exploit database (lib/patterns.js). Matches become flags.
            v
  3. AI       source + flags go to Claude, which confirms real risks,
            |    drops false alarms, and writes the summary and gas notes.
            v
  4. SHOW     result is printed in the terminal or drawn on the web page
```

Steps 1, 2 and 4 run offline with no cost. Step 3 is the only part that uses an
API key. Without a key, Sigil still runs the offline scanner and shows the raw
pattern flags, so it is useful for free.

---

## Repository layout

This project is two things that share one exploit database:

```
sigil-website/            the marketing site + live web tool (deployed on Vercel)
├── index.html              home page
├── try/index.html          the live "paste an address" tool
├── blog/index.html         blog (coming soon)
├── docs/index.html         docs (coming soon)
├── api/explain.js          serverless function powering /try
├── lib/patterns.js         THE EXPLOIT DATABASE (shared)
├── robots.txt
└── sitemap.xml

sigil-cli/                the command-line tool
├── bin/sigil.js            the `sigil` command
├── lib/
│   ├── fetch.js            gets verified source
│   ├── scan.js             runs the pattern database
│   ├── patterns.js         THE EXPLOIT DATABASE (shared)
│   ├── ai.js               the Claude call
│   └── render.js           terminal output
└── samples/                a flawed contract for testing
```

> Every file named `index.html` lives in its own folder. That is how the web
> serves clean URLs: `/blog` shows `blog/index.html` automatically. There is no
> naming clash because the folder is the name.

---

## The exploit database

The file **`lib/patterns.js`** is the heart of Sigil. It is a list of known
vulnerability shapes. Each entry says: here is a dangerous code pattern, here is
why it is dangerous, and here is the real hack where it lost money.

Growing this file is how Sigil gets smarter, and it is the part hardest for
others to copy, because it takes security knowledge, not just code.

**v1 ships with 12 patterns:** reentrancy, missing reentrancy guard, `tx.origin`
auth, `delegatecall`, `selfdestruct`, pre-0.8 overflow risk, timestamp logic,
timelock-less privileged setters, replayable signatures, unchecked low-level
calls, and inline assembly. Each links to a real incident (The DAO, Parity,
Cream Finance, and others).

A full guide to how the database works and how to add patterns is in
[`EXPLOIT-DATABASE-GUIDE.md`](./EXPLOIT-DATABASE-GUIDE.md).

---

## Install and use the CLI

Requires Node.js 18 or newer.

```bash
git clone https://github.com/<you>/sigil-cli
cd sigil-cli
npm link          # makes the `sigil` command available everywhere
```

```bash
# analyze a deployed contract (Ethereum mainnet)
sigil explain 0xdAC17F958D2ee523a2206206994597C13D831ec7

# analyze a local file
sigil explain --file contracts/MyToken.sol

# heuristics only, no AI, fully offline
sigil explain --file contracts/MyToken.sol --no-ai

# a different chain
sigil explain 0x... --chain 8453
```

---

## Keys and configuration

Sigil works with no keys (offline pattern flags only). To turn on the AI summary,
risk confirmation and gas notes, add an Anthropic key. To read contracts that are
not on Sourcify, add an Etherscan key.

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # enables the AI analysis
export ETHERSCAN_API_KEY=...            # optional, free at etherscan.io/myapikey
```

Source fetching uses [Sourcify](https://sourcify.dev) first (free, no key) and
falls back to Etherscan.

---

## The live web tool

The `/try` page lets anyone use Sigil in a browser, no install. It calls a Vercel
serverless function (`api/explain.js`) that runs the same fetch, scan and AI
steps. The API key lives as an environment variable on Vercel, so it stays secret
and never reaches the browser.

Deploy steps and key setup are in [DEPLOY.md](./DEPLOY.md).

---

## For agents (x402)

Every Sigil capability is designed to be a machine-payable API endpoint. AI agents
pay per call over **x402** in USDC, with no accounts or API keys. Audit pipelines,
deploy bots and other copilots become customers alongside human developers.

```
GET /api/audit/0x7a25...d4E9
HTTP/1.1 402 Payment Required
x402-price: 0.002 USDC

[payment settled]
HTTP/1.1 200 OK   audit.json
```

---

## Principles

- **Open core.** The fundamentals are open source, forever.
- **Grant-backed.** Built for the public-goods dev tooling tracks of major ecosystems.
- **No token.** Revenue comes from usage, not speculation.
- **Local first.** Simulation runs on your machine, read only. Code sent to AI
  features is processed transiently and never used for training.

---

## Roadmap

**Now**
- [x] Landing page and waitlist
- [x] Live web tool: `sigil explain` in the browser
- [x] Exploit pattern database v1 (12 patterns, each tied to a real incident)

**Next**
- [ ] Foundry plugin
- [ ] Hardhat plugin
- [ ] Machine-payable API endpoints via x402

**Later**
- [ ] Cursor extension
- [ ] Rust and Move support
- [ ] Fully local mode

---

## Contributing

Sigil is early and input is welcome. The most valuable contribution is a new
exploit pattern: read a hack, extract its code shape, and add it to
`lib/patterns.js` following the guide. Open an issue or a pull request.

---

## Disclaimer

Sigil flags signals, not verdicts. It is a copilot, not a substitute for a
professional audit. Always get a real audit before deploying value.

## License

MIT
