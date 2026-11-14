// Ask an Expert: shared request building and streaming loop.
// Runs in the browser (key-on-device mode) and in the Vercel function (api/ask.js).

(function (root) {
  const MODEL = "claude-opus-5-5";
  const MAX_CONTINUATIONS = 4;

  // Sites the expert may search and cite.
  const TRUSTED_DOMAINS = [
    "merckvetmanual.com", "poultrydvm.com", "backyardchickens.com", "extension.org",
    "aphis.usda.gov", "usda.gov", "extension.psu.edu", "extension.umn.edu", "poultry.extension.org",
    "cornell.edu", "ucdavis.edu", "msstate.edu", "uga.edu", "ncsu.edu", "tamu.edu", "auburn.edu",
    "aaap.memberclicks.net", "fda.gov",
  ];

  const INSTRUCTIONS = `You are the "Ask an Expert" poultry health adviser inside Gamefowl Pro, a private breeding-records app used by one keeper who raises gamefowl (Roundhead/Kelso-type game chickens) for breeding and show. You combine poultry science, practical flock keeping and veterinary knowledge.

How to answer:
- Lead with the most likely explanation and what to do today, in plain English. Use short headings or numbered steps; keep it tight unless the keeper asks for depth.
- Use the bird's log (symptom checks, treatments, notes) and any photos when they're provided. Say what you can and can't see in a photo.
- Give a ranked differential when signs are ambiguous, and say what observation would tell them apart.
- Ground claims in the Gamefowl Pro knowledge base below and in the trusted sites you can search. Search when you need specifics (drug choices, doses, withdrawal times, vaccine schedules, how a disease spreads) or when the keeper asks for sources. Name sources in the answer.
- Medications: in the US, antibiotics for poultry need a veterinary prescription. Name drug classes and what a vet commonly uses, but tell the keeper to confirm the dose with their vet and to follow label withdrawal times for eggs and meat. Never suggest off-label use of products not meant for poultry.
- Be clear about urgency. Push for a vet or state diagnostic lab when there are red flags: breathing difficulty, neurological signs, facial swelling, several birds sick, or sudden deaths. Suspected avian influenza or Newcastle disease must be reported (USDA sick-bird hotline 1-866-536-7593).
- You are not a vet and can't examine the bird; say so briefly when it matters, without repeating disclaimers every answer.

Scope: health, nutrition, housing, breeding, biosecurity and welfare. Cockfighting is illegal in all US states; do not give advice on conditioning, keeping, sparring or treating birds for fighting, on gaffs or knives, or on pit injuries framed as fights. Help with injuries from ordinary flock squabbles, predators or accidents.`;

  function knowledgeBase(conditions, refLinks) {
    const kb = conditions.map((c) => ({
      id: c.id, name: c.name, urgency: c.level, contagious: c.contagious,
      what_it_is: c.about, what_to_look_for: c.check, what_to_do: c.care, call_vet_if: c.vet,
      references: refLinks ? refLinks(c.id).filter((l) => l.kind === "merck").map((l) => l.url) : [],
    }));
    return "Gamefowl Pro knowledge base (the app's own condition write-ups; cite as 'Gamefowl Pro knowledge base'):\n" + JSON.stringify(kb);
  }

  // Build the full request. history is append-only: prior user, system (bird record) and
  // assistant turns exactly as sent/received, so earlier thinking blocks stay valid.
  function buildParams({ history, conditions, refLinks }) {
    const system = [
      { type: "text", text: INSTRUCTIONS },
      { type: "text", text: knowledgeBase(conditions, refLinks), cache_control: { type: "ephemeral" } },
    ];
    return {
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4, allowed_domains: TRUSTED_DOMAINS }],
      messages: history,
    };
  }

  // Stream one turn. Resumes pause_turn automatically. Calls onText(delta) and onStatus(text).
  // Returns { content, stop_reason, sources }.
  async function runTurn(client, params, { onText, onStatus, signal } = {}) {
    let p = params;
    let content = [];
    let message;
    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      const stream = client.beta.messages.stream(p, signal ? { signal } : undefined);
      for await (const ev of stream) {
        if (ev.type === "content_block_start") {
          const b = ev.content_block;
          if (b.type === "server_tool_use" && onStatus) onStatus("Searching trusted sources…");
          else if (b.type === "thinking" && onStatus) onStatus("Thinking…");
          else if (b.type === "text" && onStatus) onStatus("");
        } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta" && onText) {
          onText(ev.delta.text);
        }
      }
      message = await stream.finalMessage();
      content = content.concat(message.content);
      if (message.stop_reason !== "pause_turn") break;
      // Resume: resend with the paused assistant content; the server continues where it stopped.
      p = { ...params, messages: [...params.messages, { role: "assistant", content }] };
    }
    // One assistant message holding everything, to append to history as-is.
    return { content, stop_reason: message.stop_reason, sources: collectSources(content) };
  }

  function collectSources(content) {
    const seen = new Map();
    for (const b of content || []) {
      if (b.type === "text" && Array.isArray(b.citations)) {
        for (const c of b.citations) if (c.url && !seen.has(c.url)) seen.set(c.url, c.title || c.url);
      }
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) if (r.url && !seen.has(r.url)) seen.set(r.url, r.title || r.url);
      }
    }
    return [...seen].map(([url, title]) => ({ url, title }));
  }

  const api = { MODEL, TRUSTED_DOMAINS, buildParams, runTurn, collectSources };
  if (typeof module !== "undefined") module.exports = api;
  else root.ExpertCore = api;
})(typeof window !== "undefined" ? window : globalThis);
