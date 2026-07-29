/**
 * /api/explain  -  Vercel serverless function
 *
 * The browser sends { address } or { source }.
 * This runs on Vercel's servers, so the API key stays secret.
 * It fetches source, scans for exploit patterns, then asks an AI model to
 * confirm findings and write the summary + gas notes.
 *
 * AI provider: Google Gemini (free tier via Google AI Studio).
 * Set GEMINI_API_KEY in Vercel. Without it, the offline pattern flags still work.
 */

import { PATTERNS } from "../lib/patterns.js";

// Gemini free-tier model. Fast and free for this use.
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_SOURCE_CHARS = 60000;

/* ---------- source fetch (Sourcify, then Etherscan) ---------- */
async function fetchSource(address, chain = "1") {
  try {
    const res = await fetch(`https://sourcify.dev/server/files/any/${chain}/${address}`);
    if (res.ok) {
      const data = await res.json();
      const sol = (data.files || []).filter((f) => f.name.endsWith(".sol"));
      if (sol.length) return sol.map((f) => `// ${f.name}\n${f.content}`).join("\n\n");
    }
  } catch {}

  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) throw new Error("Contract not found on Sourcify. Try a file paste, or ask the maintainer to add an Etherscan key.");

  const url = `https://api.etherscan.io/v2/api?chainid=${chain}&module=contract&action=getsourcecode&address=${address}&apikey=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  const entry = data?.result?.[0];
  if (!entry || !entry.SourceCode) throw new Error("Contract is not verified.");
  let src = entry.SourceCode;
  if (src.startsWith("{")) {
    try {
      const parsed = JSON.parse(src.startsWith("{{") ? src.slice(1, -1) : src);
      const sources = parsed.sources || parsed;
      return Object.entries(sources).map(([n, o]) => `// ${n}\n${o.content || o}`).join("\n\n");
    } catch { return src; }
  }
  return src;
}

/* ---------- offline heuristic scan ---------- */
function scanSource(source) {
  const hits = [];
  for (const p of PATTERNS) {
    if (!p.regex.test(source)) continue;
    if (p.negative && p.negative.test(source)) continue;
    hits.push({ id: p.id, severity: p.severity, title: p.title, detail: p.detail, incident: p.incident });
  }
  if (hits.find((h) => h.id === "no-reentrancy-guard")) {
    const i = hits.findIndex((h) => h.id === "reentrancy-call-value");
    if (i !== -1) hits.splice(i, 1);
  }
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  hits.sort((a, b) => order[a.severity] - order[b.severity]);
  return hits;
}

/* ---------- AI step (Google Gemini, free tier) ---------- */
async function aiAnalyze(source, heuristics) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const trimmed = source.length > MAX_SOURCE_CHARS
    ? source.slice(0, MAX_SOURCE_CHARS) + "\n// ...truncated..."
    : source;
  const heurText = heuristics.length
    ? heuristics.map((h) => `- [${h.severity}] ${h.title}: ${h.detail}`).join("\n")
    : "(no heuristic hits)";

  const instruction = `You are Sigil, an expert smart contract auditor. Respond ONLY with valid JSON, no markdown, no backticks, no preamble.
Shape:
{"summary":"2-3 plain-English sentences: what the contract does and who controls what","risks":[{"severity":"high|medium|low","title":"short","detail":"one actionable sentence","incident":"real exploit or null"}],"gas":["specific optimization with impact, max 3"]}
Rules: confirm or reject the heuristic hits, drop false positives, reference real incidents only when the pattern truly matches, max 6 risks most severe first.

Heuristic scanner hits:
${heurText}

Contract source:
${trimmed}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instruction }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
    }),
  });

  if (!res.ok) throw new Error(`AI service error ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  try {
    const { address, source: pastedSource, chain = "1" } = req.body || {};
    let source = "";
    let label = "";

    if (pastedSource && pastedSource.trim()) {
      source = pastedSource;
      label = "pasted source";
    } else if (address) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        res.status(400).json({ error: "That doesn't look like a contract address (0x + 40 hex characters)." });
        return;
      }
      source = await fetchSource(address, chain);
      label = address;
    } else {
      res.status(400).json({ error: "Send an address or pasted source." });
      return;
    }

    if (!source || !source.trim()) {
      res.status(404).json({ error: "No source code found. Is the contract verified?" });
      return;
    }

    const heuristics = scanSource(source);
    let ai = null;
    try { ai = await aiAnalyze(source, heuristics); } catch (e) { /* fall back to heuristics */ }

    res.status(200).json({
      label,
      lines: source.split("\n").length,
      summary: ai?.summary || null,
      risks: ai?.risks?.length ? ai.risks : heuristics,
      gas: ai?.gas || [],
      aiUsed: !!ai,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
}
