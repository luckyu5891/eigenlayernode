# St. Alphonsa Campus Website

An interactive, phone-first website for the new St. Alphonsa Syro-Malabar Catholic Church campus at 3600 Co Rd 175, Leander, TX. The home page is an isometric map of the site drawn from the civil plan. Tap a place and it lifts off the map with a detail card of facts. Every place has a game, and finishing all five stamps a Campus Passport.

No build step, no framework, no database. Plain HTML, CSS, and JavaScript. Progress is saved in the visitor's browser.

| Place | Game |
| --- | --- |
| St. Alphonsa Church | Treasure Hunt across the map, revealing facts about St. Alphonsa and a hidden verse |
| CCD Building | Arcade: Manna Catch, Word Search, Bible Trivia, Memory Match |
| Basketball Courts | Hoops: flick to shoot, moving hoop, 60 seconds |
| Parking | Park It: steer into the space, three levels |
| Detention Ponds | Gone Fishing: cast, hook, reel, each catch unlocks a pond fact |

## Deploy on Replit

Option A, upload the zip (simplest):

1. Create a Repl with the HTML, CSS, JS template.
2. Delete the template's starter files.
3. Drag the contents of this folder in (index.html must be at the top level).
4. Press Run. Use Deploy, then Static, for a public link.

Option B, import from GitHub: choose Import from GitHub and point it at this repository. The included `.replit` file runs `node serve.js` and configures static deployment.

## Run locally

```
node serve.js
```

Then open http://localhost:3000.

## Fill in the content

See `CONTENT-CHECKLIST.md`. In short:

- `assets/img/`: drop the renderings, logo, and site plan using the listed file names.
- `assets/js/config.js`: name, address, phone, email, Mass times, donation link, project story.
- `assets/js/data.js`: facts shown on each card, trivia, treasure hunt clues, word list, fish facts.

Colours and fonts are CSS variables at the top of `assets/css/style.css`.

## How the map is built

`assets/js/iso-map.js` holds a small site model in feet (building footprints, the loop drive, parking bays, courts, the road frontage) and projects it to an isometric view at load time. Moving a building means changing a few numbers at the top of that file. Item ids (`church`, `ccd`, `courts`, `parking`, `pond`) tie the map, the cards, the games, and the passport together, so keep them unchanged.

## Files

```
index.html                 single page: map, detail panel, game overlay, visit and project sections
assets/css/style.css       design system, map, panel, overlay, game widgets
assets/js/config.js        church details (edit me)
assets/js/data.js          card facts and game content (edit me)
assets/js/common.js        passport, hunt state, toasts, modal, sounds, header
assets/js/iso-map.js       isometric map generator, pan and zoom, selection lift
assets/js/panel.js         detail card and game overlay manager
assets/js/main.js          wiring, treasure hunt mode, content sections
assets/js/games/*.js       one module per game
serve.js, .replit          static server and Replit config
CONTENT-CHECKLIST.md       what the parish still needs to supply
```
