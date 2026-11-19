---
name: hotcocker-shorts
description: Make low-cost narrated upright shorts (60–90 s, 900x1600, for Facebook/Instagram Reels, TikTok, YouTube Shorts) for HOTCOCKER and Jade's gamefowl brands from old public-domain poultry books and pictures, using the free Papermorph skill with a free Edge narrator, found CC0/public-domain pictures and no paid image or voice steps. Use when Jade asks for a short, a reel, a video or a "papermorph" clip from an old book (The Game Cock 1823, Wright's Book of Poultry, Allen & Ginter cards, Harrison Weir), a breed or colour, conformation points, or a heritage fact.
---

# HOTCOCKER shorts (Papermorph, the cheap way)

A thin, opinionated wrapper around Papermorph (github.com/DozenTwelve/Papermorph, MIT) that keeps each short to
about the cost of one ordinary Claude session. Papermorph's own SKILL.md is the manual for the engine, the shorts kit
and its scripts; this file is what to choose and what goes wrong in practice. The worked example is
`templates/chapter-example.html` + `templates/narration-example.en.json`: *The Perfect Game Cock (1823)*, 8 beats,
about 60 s, built from *The Game Cock* (1823) and the 1891 Allen & Ginter *Prize and Game Chickens* cards (CC0, The Met).

## Cost rules (why this is cheap)

- **Free voice only**: Edge TTS (`en-US-AndrewNeural`, rate +4 %). No ElevenLabs unless Jade asks and okays the price.
- **Found pictures only**: public-domain / CC0 from Wikimedia Commons. No `paint.py`, `video.py` (paid).
- **One short, one point, 120–170 words** (Edge reads ≈3.2 words/s, plus ≈1.4 s per beat): 7–9 beats, ≈60–75 s.
- **Fix the words before animating**: show Jade the script table first when she is around; Edge re-voicing is free,
  animation rework is not.
- **Work in one fresh session per short** and keep it lean: read only the Papermorph files the step needs
  (`references/films/films.md`, `references/films/shorts.md`, the `shorts.js` helper list). Don't spawn reviewer agents;
  look at the contact sheets yourself. If subagents are wanted, Sonnet for building, Haiku for downloads.
- No music by default (the first cut ships voice + Papermorph's free synthesized whooshes/ticks). Add a public-domain
  track later only if Jade wants it (`commons.py search "…" --audio`, then `music.py`).

## Content rules (HOTCOCKER)

- Angle: heritage, breeding, conformation, colours, feeding and care, the history of the books. Never promote or
  show fighting: no pits, no spurs or heels on screen, no "battle" framing. If the source is a cocking book, take its
  breeding / form / colour / husbandry passages. Cockfighting is illegal in the US and the platforms remove it.
- Quote old books faithfully; say "he claimed / he swore" for period opinions.
- End card: "Follow HOTCOCKER" + a one-line series tag (e.g. "more from the old books"). Narration says it as
  `{{HOTCOCKER|Hot Cocker}}` so the voice pronounces it while captions show the brand.
- Credit every picture: the shorts kit's `srcTag()` on every found picture (`1891 card · The Met (CC0)`), and keep
  `SOURCES.tsv`. Tell Jade to tick the platform's AI/synthetic box only if AI pictures were used (none by default).

## Good public-domain sources

- Allen & Ginter *Prize and Game Chickens* (N20, 1891), The Met, CC0: 50 colour cards incl. Black-Breasted Red,
  Brown-Breasted Red, Duckwing, Pile (cock and hen), Henny, Wheaten hen, Black Red bantams, Malay. List them:
  `python3 scripts/commons_get.py OUT --search 'intitle:"Prize and Game Chickens" Game' -n 50`.
- *The Game Cock* (1823, Landseer frontispiece): Jade's transcription is the artifact "The Game Cock (1823) ·
  Interactive edition" (read it with the Artifact tool for text; its frontispiece is the page's base64 JPEG).
- Commons PDFs (public domain): *Wright's Book of Poultry*, *The Old English Game Fowl* (Atkinson), *Cocker's Manual*,
  *The Illustrated Book of Poultry* — `commons.py get … --page N` pulls a plate.

## Steps

1. **Workspace** (once per machine): `bash SKILL_DIR/scripts/setup.sh ~/hotcocker-films` — clones Papermorph,
   copies the skill and engine, patches `tts.py` to use the HTTPS proxy, prints `export CHROME=…` if needed.
   Then `cd ~/hotcocker-films; S=.claude/skills/papermorph`.
2. **Book**: `python3 $S/scripts/new_book.py shorts <slug>` (one slug per series; episodes are ch01, ch02…).
3. **Script**: write `content/<slug>/ch01/narration.en.json` like the example: one beat per idea, `[[mark]]` before
   each word a picture or word must land on. Hook = the point itself in the first sentence.
4. **Voice** (free): `SSL_CERT_FILE=/root/.ccr/ca-bundle.crt uv run --with edge-tts python3 $S/scripts/tts.py content/<slug>/ch01/narration.en.json site/<slug>/ch01/audio/en`
   (drop SSL_CERT_FILE on a normal computer), then `python3 $S/scripts/level.py site/<slug>/ch01/audio/en/*.mp3 --lufs -14`
   and `uv run --with numpy python3 $S/scripts/sfx.py site/<slug>/ch01/audio/sfx whoosh bang tick thud`.
   "Edge returned no audio, retrying" is normal; it recovers.
5. **Pictures**: `python3 SKILL_DIR/scripts/commons_get.py books/<slug>/art/found "File:…jpg=slug" …` (run it in the
   background: Commons often answers 429 for minutes). Then list them in `books/<slug>/art/prep.json` as
   `[name, file, "full", 1800]` and run
   `uv run --with pillow --with numpy python $S/scripts/prep.py books/<slug>/art/prep.json --src books/<slug>/art/found --out site/<slug>/img`.
6. **Page**: copy `templates/chapter-example.html` to `site/<slug>/ch01/index.html` and rewrite BEATS. Patterns that
   worked: `wide(shot, name, [[t, fx, fy, s], …])` for a slow camera on a card (fx/fy = the point of the picture at
   frame centre; for the portrait Black-Breasted Red card the bird sits at fx .6, fy .42, s 1.3);
   `plate()` for a landscape engraving on the dark ground; `word()` / `label()` / `band()` for text at y 1050–1290
   so it sits under the bird, not on it; one caption slot that each point replaces (the `form` beat);
   `stamp()` for a verdict; `priceTag()` for money; a drawn shape (the `cone()` helper) to "say it literally".
   Words stay inside x 50–810, y 130–1290 (the platform's buttons cover the rest).
7. **Look**: `python3 $S/scripts/serve.py 8765 site &` then
   `CHROME=… uv run --with playwright --with pillow --with numpy python $S/scripts/strip.py ch01 books/<slug>/review/sb hook:mid,end form:end … --sheet storyboard --url http://localhost:8765/<slug>/ --browser chromium`
   and Read the sheet. Fix heads cut off, text over faces, empty black frames (a picture that never downloaded).
8. **Export**: `CHROME=… uv run --with playwright --with numpy python $S/scripts/export.py ch01 --url http://localhost:8765/<slug>/ --out books/<slug>/export --lufs -14 --captions`
   (run it in the background: about 5–10 min) gives `ch01.mp4` (1080x1920, captions burned in for sound-off
   viewers, source tags shown) + `ch01.srt`. Check it: `ffprobe` for length, and pull a few frames with
   `ffmpeg -ss 5 -i ch01.mp4 -frames:v 1 f.jpg` to look at.
9. **Deliver**: send Jade the MP4 (SendUserFile) and, if wanted, publish `site/<slug>/` as an Artifact (multi-file
   `files` map: lib/, img/, ch01/ incl. audio) so it plays in the browser. Commit the slug's `content/`, `books/`
   (minus big downloads if asked) and `site/` to the repo.

## Environment notes (Claude Code cloud sessions)

- Hosts the network must allow: `speech.platform.bing.com` (Edge voice), `commons.wikimedia.org`,
  `upload.wikimedia.org`, `thumb.wikimedia.org` (pictures), github.com (clone). Kokoro (local voice) needs
  huggingface.co, which is usually blocked: stay with Edge.
- Playwright's bundled browser may be missing: set `CHROME` to `/opt/pw-browsers/chromium-*/chrome-linux64/chrome`
  and pass `--browser chromium` (Firefox checks are skipped then; fine for a phone video).
- Background long downloads (`run_in_background`) and keep building; don't sit in sleep loops.
