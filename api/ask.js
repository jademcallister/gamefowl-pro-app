// Vercel serverless function for "Ask an Expert" (server mode).
// Env vars (set in Vercel project settings): ANTHROPIC_API_KEY, APP_PASSCODE.
// Streams newline-delimited JSON events back to the app.

const Anthropic = require("@anthropic-ai/sdk").default;
const core = require("../expert-core.js");
const { HEALTH_CONDITIONS } = require("../health-data.js");
const { healthRefLinks } = require("../health-refs.js");

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  const passcode = process.env.APP_PASSCODE;
  if (!passcode || req.headers["x-app-passcode"] !== passcode) {
    res.status(401).json({ error: "Wrong or missing passcode." });
    return;
  }
  const history = req.body && Array.isArray(req.body.messages) ? req.body.messages : null;
  if (!history || !history.length) { res.status(400).json({ error: "messages required" }); return; }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const send = (obj) => res.write(JSON.stringify(obj) + "\n");

  const controller = new AbortController();
  // Stop the Claude call if the app disconnects (not when the request body finishes).
  res.on("close", () => { if (!res.writableEnded) controller.abort(); });

  try {
    const params = core.buildParams({ history, conditions: HEALTH_CONDITIONS, refLinks: healthRefLinks });
    const result = await core.runTurn(client, params, {
      signal: controller.signal,
      onText: (d) => send({ t: "text", d }),
      onStatus: (d) => send({ t: "status", d }),
    });
    send({ t: "done", ...result });
  } catch (err) {
    let message = "Something went wrong talking to Claude.";
    if (err instanceof Anthropic.AuthenticationError) message = "The server's API key was rejected. Check ANTHROPIC_API_KEY in Vercel.";
    else if (err instanceof Anthropic.RateLimitError) message = "Rate limited. Wait a minute and try again.";
    else if (err instanceof Anthropic.BadRequestError) message = "Request rejected: " + err.message;
    else if (err instanceof Anthropic.APIError) message = `Claude API error ${err.status ?? ""}: ${err.message}`;
    send({ t: "error", message });
  }
  res.end();
};

module.exports.config = { maxDuration: 300 };
