#!/usr/bin/env python3
"""Download public-domain / CC0 pictures from Wikimedia Commons at 1280 px, politely, and log their sources.

    python3 commons_get.py OUT_DIR "File:Exact Title.jpg=slug" ["File:Other.jpg=slug2" ...]
    python3 commons_get.py OUT_DIR --search "Prize and Game Chickens" [-n 50]   # list titles only

Why not Papermorph's commons.py: Commons rate-limits full-size originals (HTTP 429) from shared cloud IPs, and its
standard thumbnails live on thumb.wikimedia.org. This asks for the 1280 px thumbnail (plenty for a 900x1600 short),
waits and retries on 429, skips files already downloaded, refuses anything not public domain / CC0, and appends
rows to OUT_DIR/SOURCES.tsv in Papermorph's format so the credits stay complete.
Hosts needed: commons.wikimedia.org, thumb.wikimedia.org (and upload.wikimedia.org).
"""
import json, os, re, sys, time, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "hotcocker-shorts/1.0 (educational heritage video)"}
HEAD = "file\ttitle\tlicence\tauthor\turl\trestrictions\tcredit\tlicence_url\tdate"


def fetch(url, tries=8):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        except Exception as e:   # 429 mostly; back off harder each time
            wait = 20 * (i + 1)
            print(f"  wait {wait}s ({str(e)[:50]})", flush=True)
            time.sleep(wait)
    return None


def api(**p):
    p.update(format="json", action="query")
    data = fetch(API + "?" + urllib.parse.urlencode(p))
    return json.loads(data) if data else {}


def clean(v):
    return re.sub(r"<[^>]+>", "", v or "").strip().replace("\t", " ").replace("\n", " ")


def main():
    out, args = sys.argv[1], sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    if args and args[0] == "--search":
        n = int(args[args.index("-n") + 1]) if "-n" in args else 30
        d = api(list="search", srnamespace=6, srlimit=n, srsearch=args[1])
        for r in d.get("query", {}).get("search", []):
            print(r["title"])
        return
    log = os.path.join(out, "SOURCES.tsv")
    rows = open(log).read().splitlines() if os.path.exists(log) else [HEAD]
    for spec in args:
        title, slug = spec.rsplit("=", 1)
        d = api(prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=1280, titles=title)
        page = next(iter(d.get("query", {}).get("pages", {}).values()), {})
        if "imageinfo" not in page:
            print("NOT FOUND", title); continue
        ii = page["imageinfo"][0]; m = ii.get("extmetadata", {})
        g = lambda k: clean(m.get(k, {}).get("value", ""))
        lic = g("LicenseShortName")
        if not re.match(r"(public domain|cc0|pd)", lic, re.I):
            print(f"REFUSED {slug}: licence {lic!r}"); continue
        path = os.path.join(out, slug + ".jpg")
        if not os.path.exists(path):
            data = fetch(ii.get("thumburl", ii["url"]).split("?")[0])
            if not data:
                print("FAILED", slug, "(try again later)"); continue
            open(path, "wb").write(data)
        rows = [r for r in rows if not r.startswith(slug + ".jpg\t")]
        rows.append("\t".join([slug + ".jpg", title, lic, g("Artist")[:120], ii["descriptionurl"], g("Restrictions"),
                               g("Credit")[:160], g("LicenseUrl"), g("DateTimeOriginal")[:40]]))
        open(log, "w").write("\n".join(rows) + "\n")
        print("OK", slug, lic, flush=True)
        time.sleep(5)


if __name__ == "__main__":
    main()
