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
  3. AI       source + flags go to an AI model, which confirms real risks,
            |    drops false alarms, and writes the summary and gas notes.
            v
  4. SHOW     result is printed in the terminal or drawn on the web page
```

Steps 1, 2 and 4 run offline with no cost. Step 3 is the only part that uses an
API key. Without a key, Sigil still runs the offline scanner and shows the raw
pattern flags, so it is useful for free.

---

## Repository layout

Two parts that share one exploit database:

```
sigil-website/            the site + live web tool (deployed on Vercel)
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
├── lib/patterns.js         THE EXPLOIT DATABASE (shared)
├── lib/fetch.js            gets verified source
├── lib/scan.js             runs the pattern database
├── lib/ai.js               the AI call
├── lib/render.js           terminal output
└── samples/                a flawed contract for testing
```

> Every file named `index.html` lives in its own folder. That is how the web
> serves clean URLs: `/blog` shows `blog/index.html` automatically. The folder is
> the name, so there is no clash.

---

## The exploit database

The file **`lib/patterns.js`** is the heart of Sigil. It is a list of known
vulnerability shapes. Each entry says: here is a dangerous code pattern, here is
why it is dangerous, and here is the real hack where it lost money. Growing this
file is how Sigil gets smarter.

Each pattern looks like this:

```javascript
{
  id: "reentrancy-call-value",
  severity: "high",
  regex: /\.call\{value:/,                 // the code shape to find
  title: "Low-level call with value transfer",
  detail: "External .call{value:} found. If state updates after the call, this is the classic reentrancy shape.",
  incident: "The DAO (2016), Cream Finance (2021)",
}
```

**v1 ships with 12 patterns:** reentrancy, missing reentrancy guard, `tx.origin`
auth, `delegatecall`, `selfdestruct`, pre-0.8 overflow risk, timestamp logic,
timelock-less privileged setters, replayable signatures, unchecked low-level
calls, and inline assembly. Each links to a real incident.

**To add a pattern:** copy an entry, change the `regex` to the dangerous code
shape, write the `title` and `detail`, and cite the `incident`. Test it, then
commit. Good sources for new patterns: rekt.news, Code4rena and Sherlock reports,
the SWC Registry, and Immunefi.

---

## Use the CLI

Requires Node.js 18 or newer.

```bash
git clone https://github.com/rohankanojia25/sigil-cli
cd sigil-cli
npm link                                   # makes `sigil` available everywhere

sigil explain 0xdAC17F958D2ee523a2206206994597C13D831ec7   # a deployed contract
sigil explain --file contracts/MyToken.sol                 # a local file
sigil explain --file contracts/MyToken.sol --no-ai         # offline, flags only
sigil explain 0x... --chain 8453                           # a different chain
```

---

## Setup: keys (one time, by the maintainer)

End users set up nothing. They just visit the site and use it. The keys below are
added once by the project owner so the hosted tool works for everyone.

Source fetching uses [Sourcify](https://sourcify.dev) first (free, no key) and
falls back to Etherscan.

| Variable | What it does | Where to get it | Cost |
|---|---|---|---|
| `GEMINI_API_KEY` | Turns on the AI summary, risk confirmation and gas notes | aistudio.google.com | Free tier |
| `ETHERSCAN_API_KEY` | Reads contracts not on Sourcify (like USDT) | etherscan.io/myapikey | Free |

**For the website (Vercel):** add these under Settings, Environment Variables
(Production and Preview), then redeploy from the Deployments tab so they load.

**For the CLI (your machine):**

```bash
export GEMINI_API_KEY=...
export ETHERSCAN_API_KEY=...
```

Without a key, everything still runs and shows the offline pattern flags.

---

## The live web tool

The `/try` page lets anyone use Sigil in a browser, no install and no account. It
calls a serverless function (`api/explain.js`) that runs the same fetch, scan and
AI steps. The key lives on the server, so it stays secret and never reaches the
browser. Users pay nothing and set up nothing.

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
`lib/patterns.js`. Open an issue or a pull request.

---

## Disclaimer

Sigil flags signals, not verdicts. It is a copilot, not a substitute for a
professional audit. Always get a real audit before deploying value.

## License

MIT
