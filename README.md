# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dagol04/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dagol04/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legends** — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden). Every trophy shows its official name, description and grade exactly as PlayStation publishes them, plus a guide written in our own words that names its sources (Exophase, PSNProfiles, GTA Wiki, IGN, PowerPyx). It includes a five-stage roadmap to the platinum, missable flags for 24 trophies (story chapters and missions, stranger-strand finales, partner moments and one-off stunts), a checklist saved in localStorage with export/import, filters (story, missable, collectibles, activities, online) and a spoiler setting that hides story trophies until they are earned. It runs fully offline from static files — no build step, no network at run time, no Rockstar artwork.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or serve `app/` with any static server and open `app/index.html`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wb8h7f8k&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
