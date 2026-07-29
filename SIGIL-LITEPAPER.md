# Sigil Litepaper

**An AI copilot for smart contract security.**

Why the next generation of on-chain code needs a reader that thinks like an
auditor, and how Sigil is building it in the open.

*Open source · No token · Solidity, Rust and Move · v1, 2026*

---

## 1. The problem

Smart contracts hold value directly. A bug in ordinary software causes a crash or
a bad user experience. A bug in a smart contract causes an irreversible loss of
money, often within minutes of deployment, often for people who never read a line
of the code.

Every year, billions of dollars are drained from contracts through mistakes that
were, in hindsight, well understood: a state update placed after an external call,
an owner key with no timelock, a signature with no nonce. The knowledge to prevent
these exists. It is scattered across audit reports, exploit post-mortems, and the
memories of a small number of security researchers.

> The information needed to prevent most hacks already exists. It is just not where
> developers write code.

Meanwhile, AI has made writing contracts faster than ever. More code is shipped by
more people, many new to the space, using general-purpose copilots that were never
built for adversarial, value-bearing code. The result is a widening gap between how
fast contracts are written and how carefully they are checked.

## 2. Why general copilots fall short

General AI copilots are trained to produce code that compiles and runs. For most
software, that is enough. For smart contracts, compiling is the easy part. The hard
part is surviving contact with an adversary who is financially motivated to break
you.

A general copilot will happily write a withdraw function with the external call
before the state update. It compiles. It works in testing. It is also the exact
shape that drained The DAO in 2016. The copilot does not know this, because it
reasons about syntax, not about how contracts get exploited.

What is missing is not more general intelligence. It is specialized memory: a
system that has seen every published way a contract has lost money, and checks new
code against that memory before it ships.

## 3. What Sigil is

Sigil is an AI copilot built only for smart contracts. Point it at a contract, from
a file in your editor or a deployed address on-chain, and it returns three things:

- A plain-English summary of what the contract does and who controls what.
- Exploit pattern flags, each matched to a real incident where that shape lost money.
- Gas and quality notes a developer can act on directly.

It works from the command line, in the browser with no install, and as
machine-payable endpoints other software can call. It supports Solidity today, with
Rust and Move on the roadmap, and integrates with Foundry, Hardhat, Remix, Cursor
and MCP.

> Read the contract before the contract reads you.

## 4. How it works

A scan moves through four stages. Three are deterministic and free; only one uses
an AI model.

```
1. FETCH   verified source is retrieved (Sourcify, then Etherscan)
2. SCAN    source is checked against the exploit pattern database
3. AI      a model confirms real risks, drops false alarms, and
           writes the summary and gas notes
4. SHOW    results render in the terminal or the browser
```

The separation matters. The pattern scan is transparent and reproducible: anyone
can read the database and see why a flag fired. The AI step adds judgment on top,
confirming which flags are real in context and explaining them in plain language.
The heuristics find candidates; the AI is the reviewer. Neither replaces a human
audit, and Sigil never claims to.

## 5. The exploit pattern database

The core of Sigil is a growing database of vulnerability patterns. Each entry
describes a dangerous code shape, why it is dangerous, and the real incident where
it lost money.

```javascript
{
  id: "reentrancy-call-value",
  severity: "high",
  title: "Value transfer before state update",
  incident: "The DAO (2016), Cream Finance (2021)",
}
```

Version one ships with twelve patterns covering the most costly classes of bug:
reentrancy, missing guards, tx.origin auth, delegatecall, selfdestruct, pre-0.8
overflow, unsafe timestamp logic, timelock-less privileged setters, replayable
signatures, unchecked calls, and inline assembly.

This database is the part of Sigil that compounds. It is also the part hardest to
copy, because it is built from security knowledge, not just code. Every published
hack is a new entry. Over time, Sigil aims to hold more of this memory in one place
than any single developer could carry, and to make it available at the moment of
writing rather than the moment of the post-mortem.

## 6. The machine economy

Increasingly, code is not only written by people. AI agents deploy contracts,
manage treasuries, and call each other's services autonomously. These agents need
the same safety check human developers do, in a form they can pay for and consume
without an account.

Every Sigil capability is designed as a machine-payable endpoint over x402, the
emerging standard for per-call payments between software. An audit pipeline, a
deployment bot, or another copilot can request an analysis and settle payment in
the same request, in stablecoins, with no API keys or sign-up.

```
GET /api/audit/0x7a25...d4E9
HTTP/1.1 402 Payment Required
x402-price: 0.002 USDC

[payment settled]
HTTP/1.1 200 OK   audit.json
```

This is how Sigil earns without a token: humans use it free and open, machines pay
per call for what they consume. Revenue comes from real usage, not speculation.

## 7. Principles

- **Open core.** The fundamentals, including the pattern database, are open source.
  Security tooling that asks you to trust a black box is a contradiction.
- **Grant-backed, no token.** Sigil is funded to be a public good. There is no
  token, no speculation, and no gate on the core. Value flows from usage.
- **Local first.** Simulation runs on your machine and is read only. Nothing about
  your unpublished code needs to leave your computer.
- **Honest about limits.** Sigil flags signals, not verdicts. It is a copilot, not
  a substitute for a professional audit, and it says so every time.

## 8. Roadmap

**Now**
- Live web tool: explain any verified contract in the browser
- Command-line tool for local files and addresses
- Exploit pattern database, version one

**Next**
- Foundry and Hardhat plugins, so checks run inside the developer's workflow
- Machine-payable endpoints over x402
- A deeper pattern database drawn from recent audit findings

**Later**
- Cursor extension
- Rust and Move support
- Fully local inference mode for teams that cannot send code anywhere

## 9. The thesis

On-chain code is only going to hold more value, and more of it will be written with
AI assistance by people who are not security experts. The tools that check that code
have to keep pace, and general copilots will not, because safety here is a
specialized discipline, not a general one.

Sigil's bet is simple: gather the world's exploit knowledge into one open, growing
database, put an AI reviewer on top of it, and deliver it at the exact moment code
is written. Make it free for people, payable for machines, and honest about being
one layer of defense rather than the whole wall.

> Every drained protocol compiled fine. Sigil exists for everything that happens
> after that.

---

*Sigil is live and open. Try it on any verified contract: https://sigil-website.vercel.app/try*
