# Handoff: Under The Feather and chicken health plans

Last updated 2026-11-13. Read this first in any new chat that continues this work.

## 1. Where everything is

| What | Where |
| --- | --- |
| Repository | `jademcallister/gamefowl-pro-app` |
| Working branch | `claude/serene-brahmagupta-p6dejo` (not merged into `main`; no pull request yet) |
| The new app | `under-the-feather/` folder |
| Original Gamefowl Pro app | `index.html`, `app.js`, `styles.css` at the repo root (Evaluate, Decision, Records tabs). It now has an "Anatomy Explorer" button linking to the new app. |
| Test build (private link) | https://claude.ai/artifact/DKS9qdqWN1mRksgGQWsxr5 |
| Feature plan (editable doc) | https://claude.ai/artifact/9RDZCkAwGXxNcpd7TvaMjk |
| Feature plan (image) | `under-the-feather/feature-plan.jpg` |
| Screenshots | `under-the-feather/preview-desktop.png`, `under-the-feather/preview-explorer.png` |

The artifact links are private to Jade's account until shared from the page's Share menu.

## 2. What we built: Under The Feather

**One line:** interactive gamefowl anatomy and care, in your pocket.

It is a gamefowl version of the iPhone app *Inside The Equine* (an interactive 3D horse anatomy app). We copied its design and features, not its name, logo, images or text. It runs in a web browser (phone or computer); it is not an App Store app yet.

### Features in the test build
- **Explorer:** a drawn rooster (SVG, not 3D) with three views: Skeleton, Muscles (Superficial / Intermediate / Deep layers) and Exterior. 50 tappable structures. Tapping one highlights it in blue and opens a panel: description, function, origin/insertion or details, and breeder notes. Zoom, drag, flip and search.
- **Word origins:** underlined gold terms (e.g. *pygostyle*, *carina*) show their Latin/Greek meaning when tapped.
- **Home:** daily challenge question, XP, streak with weekday checkmarks, "Did you know?" fact, continue-course card.
- **Courses:** 6 courses, 15 lessons, each with a quiz (+10 XP when passed): Gamefowl Anatomy, Conformation (follows Jade's 8-point checklist), Health & Common Conditions (Pro), Nutrition & Care (Pro), Breeding & Records (Pro), Terminology.
- **Breed library:** Aseel, Shamo, Old English Game, Modern Game, Malay, Sumatra, American Game, Madagascar Game.
- **Account:** name, progress stats, Pro upgrade card, reset, disclaimer (educational, not veterinary advice; does not support animal fighting).
- **Design:** near-black background, gold accents, Newsreader serif headings, Inter body text. On desktop it shows as a phone next to an intro panel.

### Files in `under-the-feather/`
| File | Holds |
| --- | --- |
| `index.html` | Page shell, desktop intro column, tab bar |
| `styles.css` | All styling; colors are CSS variables on `:root` |
| `config.js` | App name, price, checkout link, support email, terms/privacy links, `lockProContent` |
| `data.js` | All content: word origins, 50 structures, courses and quizzes, breeds, daily questions, facts |
| `bird.js` | The rooster drawings for each system and muscle layer; each tappable part has a `data-id` matching `data.js` |
| `app.js` | Screens, navigation, quizzes, XP/streaks (saved in the browser only), tooltips |

### Still to fill in (`config.js`)
- `checkoutUrl` (Pro payment link). Empty = Pro button says "coming soon".
- `proPriceMonthly` (placeholder $9.99), `supportEmail`, `termsUrl`, `privacyUrl`, `contactUrl`.
- `lockProContent`: `false` keeps all courses open for testing; `true` locks Pro courses.

### Known limits
- Flat drawing, not 3D. Progress is saved only on one device/browser. No logins, no payments, no App Store build.

### Tested
Desktop and iPhone 13 size in a headless browser: no page errors, no sideways scrolling. Every tab, a structure panel, a word-origin tooltip, all three systems, the deep muscle layer and a full lesson were clicked through.

## 3. About the original horse app (for comparison)
From its App Store listing, checked 2026-11-12:
- Launched around June 23, 2026; 24 updates since.
- 13 ratings, 5.0 stars. Free with one subscription: Pro at $19.99/month, 7-day free trial.
- Its main selling point is the real 3D horse. Sales numbers are not public; 13 ratings suggests a small user base so far.

## 4. Feature plan (13 items, in the doc and the JPEG)
1. Real plates with tap zones (needs Jade's plates and their sources)
2. Show labels switch
3. "Find it" quiz (tap the named part)
4. X-ray slider (needs three matching images of one bird)
5. Digestive and organ system view (needs Jade's digestive diagrams)
6. Good vs. faulty side by side (needs defect and ideal images, paired)
7. Score your own bird, saved by band number in Gamefowl Pro Records (needs RED ROCK line standard)
8. Problem checker (needs a vet or experienced keeper to review)
9. Breeding calculator (start with comb and leg color)
10. Hatch timeline (21 days)
11. Spoken names
12. Real 3D rooster (needs a licensed or commissioned 3D model)
13. Accounts, payments and App Store (needs Stripe, Apple Developer account $99/yr, a price)

Recommended order: 1–3, then 5–6, then 7, then the rest.

## 5. Images Jade is sending
Jade has many anatomy plates, digestive diagrams, defect images and ideal-conformation images. Agreed plan:
- Send as a zip uploaded in chat. Suggested folders: `anatomy/`, `digestive/`, `defects/`, `conformation-ideal/`, `breeds/`, `other/`.
- Original full-size files; a `sources.txt` noting where each came from if known.
- Next step on receipt: sort into "safe to use" and "check first", then build the first plate with tap zones into the Explorer.

Image rules for a paid app: use only images Jade owns, public-domain images, or images licensed for commercial use. In the US, works published before 1931 are public domain. Good free sources: *The Structure of the Fowl* (Bradley, 1915), *Avian Anatomy: Integument* (USDA, 1972), Lewis Wright's *Illustrated Book of Poultry* (1870s), Biodiversity Heritage Library, Internet Archive, and Wikimedia Commons (avoid "NC" licenses). Paid: Adobe Stock (connector available), Science Photo Library, 3D models from TurboSquid/CGTrader/Sketchfab.

## 6. Chicken health app research (not built yet)
Jade wants an in-depth chicken health and diagnosis tool. Nothing for it exists in this repo yet.

**Apps and sites to model on:** PoultryDVM symptom checker (https://www.poultrydvm.com/views/symptoms.php), CluckDoc (https://apps.apple.com/us/app/id6752720591), Coop: Backyard Chicken Keeper (https://apps.apple.com/us/app/id6760012302).

**How CluckDoc likely works:** the app is only 2.9 MB, so its AI almost certainly runs online: it sends the photo to a general vision AI with instructions. Its code is private, so this is inferred, not confirmed. Premium features: photo diagnosis, breed predictor, feed analyzer, egg trends, weekly AI flock reports.

**The ~8,000-image dataset:** the Zenodo "Machine Learning Dataset for Poultry Diseases Diagnostics" (https://zenodo.org/record/4628934): roughly 6,800–8,400 photos of chicken droppings labeled healthy, coccidiosis, salmonella or Newcastle disease. Ready-trained models exist (e.g. N-Anya, https://huggingface.co/nche-ai/n-anya, about 80% accuracy as reported by its author). It is **not** used in anything we built. Check its license before commercial use.

**Other findings:** a lesion detector for Newcastle disease, coccidiosis and fowl pox (https://huggingface.co/Evet-Africa/poultry-disease-detector) is AGPL-licensed, so avoid it in a paid app. Roboflow hosts callable models (sick/healthy chicken, droppings). No good ready-made poultry health skill or API was found; best to write our own.

**Recommended build:**
1. Condition guide (40–60 conditions: signs, body part, what to do now, prevention, when to call a vet), written from trusted references (Merck Veterinary Manual, university extension guides) and reviewed by a vet.
2. Question-based symptom checker using the guide (no AI cost).
3. Photo check: photo + answers sent to a vision AI that answers only from our guide. Needs a small server to keep the AI key secret; costs a few cents per check.
4. Droppings check using the Zenodo-based models.
5. Safety rule: signs of bird flu or Newcastle disease always tell the user to contact the state veterinarian (reportable diseases).

Open question for Jade: separate health app, or a problem checker inside Under The Feather?

## 7. Environment notes
- Hosts added to the cloud environment "REDROCK GAMEFOWL": `apps.apple.com`, `is1-ssl.mzstatic.com`.
- Jade's 8-point conformation checklist is in the `gamefowl-conformation` skill. The RED ROCK line standard is not written down yet.

## 8. Waiting on Jade
- [ ] The image zip
- [ ] Pro price, payment link, support email, terms and privacy links
- [ ] RED ROCK line standard
- [ ] Decision: health tool as its own app or inside Under The Feather
- [ ] Whether to open a pull request to merge into `main`, and where to host the app publicly
