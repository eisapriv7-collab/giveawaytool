# Giveaway Tool — Architecture Notes

Generated from a static read of the repo at commit `c40fe15`. Every number below was
measured, not estimated, unless explicitly labelled.

## Layout

The entire application is two files.

| File | Lines | Bytes | Role |
|---|---|---|---|
| `index.html` | 31,490 | 2,664,139 | Dashboard + every mini-game, all inline |
| `api/chatroom.js` | 46 | 1,344 | Vercel serverless proxy to Kick's channel API |

Inside `index.html`:

- 8 non-trivial inline `<script>` blocks, **28,647 lines of JS**
- 2,843 lines of HTML + CSS
- 1 external script remains: `https://cdn.tailwindcss.com`
- Google Fonts (Space Grotesk, JetBrains Mono, Inter)

## Runtime model

There is no build step and no module system. One global scope, 846 top-level
`function` declarations, state in module-level `let`/`const`.

**Entrant state is passed between windows via `localStorage`.** The dashboard writes four
keys, then opens a popup that reads them back:

| Key | Written by | Read by |
|---|---|---|
| `giveaway_entrants` | `openGamePopup()` | popup `init()` |
| `giveaway_title` | `openGamePopup()` | popup `init()` |
| `giveaway_keyword` | `openGamePopup()` | popup `init()` |
| `giveaway_chatroom_id` | `openGamePopup()` | popup `init()` |

**Routing** is a single query param. `openGamePopup(type)` (line ~3310) opens
`?game=<type>` sized to `screen.availWidth/availHeight`. The popup's `init()` IIFE
(line ~22689) reads `?game=`, hydrates entrants from `localStorage`, hides
`#setup-screen` and `#dashboard-screen`, optionally calls `connectKickChat(chatroomId)`,
then dispatches through a 75-branch `if/else if` chain to `run<Game>()`.

Two extra standalone routes exist: `?tournament=1` (manual tournament page) and
`?watch=<token>` (spectate).

**Chat** connects over the Kick websocket. `api/chatroom.js` exists only because
`kick.com/api/v2/channels/{name}` is CORS-blocked from the browser; it forwards the
request with a desktop Chrome UA and returns `chatroomId`. Note it only implements
`GET`/`OPTIONS` and caches nothing.

## Game inventory

75 dispatcher entries. Of these:

- **43 retired branches** — the game id appears in both `RETIRED_GAME_IDS` and the
  dispatcher
- **32 live branches**, of which **31 are reachable from a dashboard button**. The 32nd
  is `highnoon`, which has a dispatcher branch and a `runHighNoon()` but no
  `launchHighNoon()` — it is only reachable by typing `?game=highnoon` directly.

Live games: `babyoil board bomb boxing bumper butts chicken derby diddy2 dodgeball
f1drift flush giveaway highcard hill laser lava milk office orbit racing slap slot
subway sumo swimming sword takedown tekken thunder twerk` (+ `highnoon` by URL).

`RETIRED_GAME_IDS` (line 22681) holds **44** entries — one more than there are retired
dispatcher branches. The extra is `bracket`: retired, with no dispatcher branch at all.

`RETIRED_GAME_IDS` has exactly **two** references in the file: its definition, and the
guard at line 22693 that does `window.location.replace(...)` back to the dashboard.

That guard is the only thing retiring a game. The 43 retired ids still have:

- a working `launch<Game>()` function
- a branch in the dispatcher
- their full `run<Game>()` implementation
- their HTML overlay markup

They are **not** wired to any dashboard button — I checked for `onclick`/`onmouseenter`/
`data-preview` references to all 43 launch functions and found **zero**. So nothing in
the UI is broken; the code is simply unreachable.

Game-id groupings that gate behaviour:

- `INTERACTIVE_GAMES` (6): `dice trivia roulette coin emoji math` — all retired
- `RACE_GAME_IDS` (21): racing, swimming, balloon, … — mixed
- `LIVE_CHAT_GAME_IDS` (2): `milk board`

## Dead code, measured

Static reachability analysis over the parsed call graph (846 functions, edges from
identifier-followed-by-paren matching a known function name), seeded from the 43 retired
dispatcher roots versus everything else:

> **105 functions / 3,904 lines (12.4% of the file) are reachable only from retired
> games.**

Largest: `startBingo` (218), `startBowling` (162), `startPinball` (137),
`startParachute` (122), `startZeroG` (119), `startTrampoline` (113),
`startObstacleSprint` (112), `startBalloonRace` (112).

Caveats on that number: it is name-based, so it will **miss** anything dispatched through
`window[name]`, `eval`, string-built identifiers, or event-handler attributes, and it
**excludes** the retired games' HTML overlay markup. Treat 12.4% as a floor.

Three overlays have neither a launch function nor a retired entry: `boardwalk`, `game`,
`highnoon` (`highnoon` does have a `runHighNoon()` dispatcher branch).

## Verification performed

- `node --check` on each extracted inline `<script>` block: **8 passed, 0 failed**
- `python3 -m http.server 8000` → `HTTP 200`, 2,664,139 bytes
- Doctype present; exactly one `</body>` and one `</html>`

Not verified: runtime behaviour. Nothing here exercises the games, the Kick websocket,
or `api/chatroom.js`. There are no tests in the repo and no test runner configured.

## Cleanup applied (commit `c40fe15`)

1. Removed 3 Cloudflare `cdn-cgi/challenge-platform` loader injections. These were
   captured when the HTML was saved from the live site — not authored source.
2. Removed `firebase-app-compat.js` and `firebase-database-compat.js`. The file
   contained no `initializeApp`, `databaseURL`, or `apiKey` reference anywhere; the only
   two `firebase` matches were the script tags themselves.
3. Repaired `</body</html>` into proper `</body>` / `</html>`.

Net: 31,494 → 31,490 lines, 2,667,141 → 2,664,139 bytes (`git diff --stat`: 2 insertions,
6 deletions).

## Known constraints if you keep the monolith

- No way to unit-test a game without a browser and a DOM.
- Any edit risks the global scope; 846 functions share one namespace.
- The file is 2.6 MB, so GitHub's diff view and most editors degrade on it.
- Popup-based game windows depend on `window.open` not being blocked.
- `localStorage` handoff means the popup must be same-origin with the dashboard.
