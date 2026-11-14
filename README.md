# Gamefowl Pro

Open `index.html` in a browser (or host the folder on Vercel, below).

## Health tab
- **Symptom Checker**: pick a body area, tick symptoms, and get ranked possible causes with care steps, vet warnings, photos, Merck Vet Manual references and links to real cases. Save a check to a bird's log, or send it to Ask an Expert.
- **Bird Log**: per-bird (Band ID) photo timeline, treatment tracker (days, doses given, withdrawal end date) and saved expert answers.

Photos and logs are stored on the device (IndexedDB), not uploaded anywhere. Clearing browser data erases them.
Condition write-ups are original guidance, not a veterinary diagnosis. Photos are openly licensed from Wikimedia Commons; credits and licenses are shown under each photo and listed in `health-images.js`.

## Ask an Expert tab
A Claude-powered poultry health adviser. Each answer draws on:
- the app's condition library (`health-data.js`) with its Merck references (`health-refs.js`)
- live web search limited to trusted sites (Merck Vet Manual, PoultryDVM, BackyardChickens, USDA, university extension); sources are listed under each answer
- the selected bird's log and photos, plus any photos you attach

It can connect in two ways (⚙ Settings in the tab):

### 1. Your API key on this device (quickest)
1. Create a key at console.anthropic.com → API Keys (usage is billed to that account, separate from a Claude subscription).
2. In the app: Ask an Expert → ⚙ Settings → "My API key" → paste → Save.

The key stays in that browser only and is sent only to Anthropic. Use this on your own devices only.

### 2. Your own server on Vercel (works from any device, key never in the browser)
1. Import this repo into Vercel (no build settings needed; `api/ask.js` becomes the function).
2. Project → Settings → Environment Variables:
   - `ANTHROPIC_API_KEY`: your key
   - `APP_PASSCODE`: any passcode you choose
3. Redeploy, open the site, then Ask an Expert → ⚙ Settings → "My server", address `/api/ask`, enter the passcode → Save.

## Files
- `health-data.js`, `health-refs.js`, `health-images.js`: condition library, references, photo credits
- `health.js`: symptom checker and bird log
- `expert-core.js`: shared prompt and streaming logic (browser and server)
- `ask-expert.js`: chat UI
- `api/ask.js`: optional Vercel function
- `vendor/anthropic-sdk-1.3.0.js`: Anthropic JS SDK bundled for the browser

## Live site
https://chickenhealth.hotcockergamefowl.com (Vercel project `chickenhealth`).

The Vercel project holds only `index.html` and `deploy/vercel.json` (deployed as `vercel.json`). Every other file is served from this public repo through jsDelivr, pinned to a commit. To publish an update: push, put the new commit SHA in `deploy/vercel.json`, and redeploy those two files. Server mode (`api/ask.js`) is not deployed this way; "My API key" mode and "Ask in Claude app" work.
