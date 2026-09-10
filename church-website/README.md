# Church Campus Website

An interactive website where the landing page is an illustrated map of the church campus. Visitors tap a building to step inside and find an activity. Completing an activity earns a stamp in a Campus Passport, and six stamps unlock a certificate.

No build step, no framework, no database. Plain HTML, CSS, and JavaScript. Progress is saved in the visitor's browser.

## What is inside

| Building | Page | Activities |
| --- | --- | --- |
| Sanctuary | sanctuary.html | Verse of the day, service times, Scripture Scramble |
| Fellowship Hall Arcade | arcade.html | Manna Catch (canvas game), Word Search, Bible Trivia |
| Bell Tower | tower.html | Campus Treasure Hunt: six clues, each pointing at a building on the map |
| Children's Wing | kids.html | Noah's Ark Memory Match, Coloring Book with PNG download |
| Prayer Garden | garden.html | Prayer Wall, one-minute Quiet Moment breathing timer |
| Welcome Center | welcome.html | Plan your visit, what to expect, FAQ, Google Maps embed, contact form |

The campus map lives in index.html as inline SVG, so it scales to any screen and needs no image files.

## Deploy on Replit

Option A, upload the zip (simplest):

1. On Replit choose Create Repl, pick the HTML, CSS, JS template, and name it.
2. In the file panel, delete the template's starter files.
3. Drag the contents of this folder (not the folder itself) into the Repl. index.html must sit at the top level.
4. Press Run. Replit serves index.html. Use Deploy, then Static, for a public link.

Option B, Node template:

1. Create a Node.js Repl and upload the same files.
2. The included .replit file already sets the run command to node serve.js and maps port 3000. Press Run.

Option C, import from GitHub: on Replit choose Import from GitHub and point it at this repository. The .replit file handles the rest.

## Run locally

```
node serve.js
```

Then open http://localhost:3000. Any static server works too, for example python3 -m http.server.

## Customise in two files

- assets/js/config.js: church name, tagline, address, phone, email, service times, the About paragraph, and the search text for the map embed.
- assets/js/data.js: every verse, trivia question, word list, treasure hunt clue, and the building list. Add or remove entries and the games adapt.

Colours and fonts are CSS variables at the top of assets/css/style.css.

To move a building on the map, edit the matching block in index.html (each is wrapped in an anchor with a data-id). Keep the data-id values unchanged, as the passport and treasure hunt key off them.

## Privacy notes

- Prayer Wall posts and Passport progress are stored only in the visitor's own browser (localStorage). Nothing is sent to a server.
- The contact form and the pastoral team button open the visitor's email app with a pre-filled message. Set the destination address in config.js.
- The Google Maps embed loads from Google when the Welcome Center page is opened.

## Files

```
index.html            campus map landing page
sanctuary.html        arcade.html   tower.html   kids.html   garden.html   welcome.html
assets/css/style.css  shared design system
assets/css/map.css    map animations and hunt banner
assets/js/config.js   church details (edit me)
assets/js/data.js     content: verses, trivia, clues, words (edit me)
assets/js/common.js   header, passport, toasts, modal, sounds
assets/js/map.js      map interactions and treasure hunt mode
assets/js/*.js        one script per building
serve.js              tiny static server for Replit or local preview
.replit               Replit run and deployment settings
```
