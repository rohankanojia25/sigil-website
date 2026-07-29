/**
 * lib/patterns.js
 * Exploit pattern database v1.
 * Each pattern: a regex heuristic + why it matters + a real incident reference.
 * These are signals, not verdicts. The AI step (and a human) confirms.
 */

export const PATTERNS = [
  {
    id: "reentrancy-call-value",
    severity: "high",
    regex: /\.call\{value:/,
    title: "Low-level call with value transfer",
    detail:
      "External .call{value:} found. If state is updated after the call, this is the classic reentrancy shape.",
    incident: "The DAO (2016), Cream Finance (2021)",
  },
  {
    id: "no-reentrancy-guard",
    severity: "medium",
    regex: /\.call\{value:/,
    negative: /nonReentrant|ReentrancyGuard/,
    title: "Value transfer without a reentrancy guard",
    detail:
      "Contract sends ETH via low-level call but never imports ReentrancyGuard or uses nonReentrant.",
    incident: "Rari Capital / Fei (2022)",
  },
  {
    id: "tx-origin-auth",
    severity: "high",
    regex: /tx\.origin/,
    title: "tx.origin used",
    detail:
      "If tx.origin is used for authorization, any contract the owner interacts with can impersonate them. Use msg.sender.",
    incident: "THORChain phishing vector (2021)",
  },
  {
    id: "delegatecall",
    severity: "high",
    regex: /\.delegatecall\(/,
    title: "delegatecall present",
    detail:
      "delegatecall executes foreign code in this contract's storage context. If the target is influenceable, full takeover is possible.",
    incident: "Parity Wallet (2017, $150M+ frozen)",
  },
  {
    id: "selfdestruct",
    severity: "medium",
    regex: /selfdestruct\s*\(/,
    title: "selfdestruct present",
    detail:
      "The contract can be destroyed. If reachable by the wrong caller, funds and logic disappear.",
    incident: "Parity Wallet kill (2017)",
  },
  {
    id: "old-pragma",
    severity: "medium",
    regex: /pragma\s+solidity\s*[\^>=<]*\s*0\.[4-7]\./,
    title: "Solidity older than 0.8",
    detail:
      "No built-in overflow checks before 0.8. Arithmetic can wrap silently unless SafeMath is used everywhere.",
    incident: "BeautyChain BEC overflow (2018)",
  },
  {
    id: "timestamp-logic",
    severity: "low",
    regex: /block\.timestamp/,
    title: "block.timestamp in logic",
    detail:
      "Validators can nudge timestamps. Fine for long durations, dangerous for randomness or tight deadlines.",
    incident: "Various GameFi randomness exploits",
  },
  {
    id: "privileged-setter",
    severity: "medium",
    regex: /function\s+set[A-Z]\w*\([^)]*\)\s+(external|public)[^{]*onlyOwner/,
    title: "Owner can change critical parameters instantly",
    detail:
      "Privileged setter functions with no timelock. If keys are stolen (or the owner turns malicious), parameters like oracles or fees flip instantly.",
    incident: "Multiple rugpulls and key-compromise drains",
  },
  {
    id: "ecrecover-raw",
    severity: "medium",
    regex: /ecrecover\s*\(/,
    negative: /nonce/i,
    title: "Signature check without an obvious nonce",
    detail:
      "ecrecover found but no nonce mentioned nearby. Signed messages may be replayable.",
    incident: "Wintermute Optimism replay-adjacent (2022)",
  },
  {
    id: "transfer-send",
    severity: "low",
    regex: /\.transfer\(|\.send\(/,
    title: ".transfer or .send used",
    detail:
      "These forward only 2300 gas. Payments to smart contract wallets (like multisigs) can fail and lock funds.",
    incident: "Common post-Istanbul breakage pattern",
  },
  {
    id: "unchecked-call",
    severity: "medium",
    regex: /\.call\([^)]*\);(?!\s*require)/,
    title: "Low-level call with possibly unchecked return",
    detail:
      "Low-level calls do not revert on failure. If the return value is ignored, failures pass silently.",
    incident: "King of the Ether (2016)",
  },
  {
    id: "assembly-block",
    severity: "info",
    regex: /assembly\s*\{/,
    title: "Inline assembly present",
    detail:
      "Assembly skips Solidity's safety rails. Not a bug by itself, but audit attention concentrates here.",
    incident: null,
  },
];
