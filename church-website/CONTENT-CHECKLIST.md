# Content checklist

Everything the site needs from the parish before launch. Placeholders are live now, so the site works today and gets better as each line is filled in.

Edit locations: `assets/js/config.js` (church details), `assets/js/data.js` (facts and game content), `assets/img/` (images).

## 1. Images (drop into assets/img/ with these exact names)

| File | Used for | Notes |
| --- | --- | --- |
| `church-rendering.jpg` | Church detail card | The Judson Associates rendering. Landscape, 1600 px wide is plenty |
| `ccd-rendering.jpg` | CCD building card | The gray building rendering |
| `courts.jpg` | Basketball courts card | Optional. A rendering or a photo of a similar court |
| `parking.jpg` | Parking card | Optional |
| `pond.jpg` | Detention ponds card | Optional. A photo of the site or a similar pond |
| `logo.png` | Header mark | Square, transparent background if possible |
| `st-alphonsa.jpg` | Reserved for a future saint page | Optional |

Missing files are hidden automatically. JPG or PNG both work. Keep each under 500 KB for phones.

## 2. Church details (config.js)

Filled from stalphonsaaustin.com in September 2026. Please confirm the items marked VERIFY.

- [x] Church name, diocese (St. Thomas Syro-Malabar Catholic Diocese of Chicago)
- [x] New campus address: 3600 Co Rd 175, Leander, TX 78641
- [x] Phone 512-740-2262 and email trustees@stalphonsaaustin.com (VERIFY)
- [x] Website, Facebook page, YouTube channel
- [x] Vicar: Fr. Anto G. Alappat (VERIFY spelling)
- [x] Holy Qurbana schedule, school-year version: Sunday 9:30 AM Malayalam, 9:30 AM CCD, 11:00 AM English, 12:30 PM Malayalam class; Tue and Fri 7:00 PM; Wed, Thu, Sat 9:00 AM. The site also shows a summer schedule (Sunday 9:00 AM Malayalam, 11:45 AM English). Tell us if the site should switch automatically by season.
- [ ] Where the parish gathers during construction. The Manor church on Burleson Manor Rd has been sold, so the card currently points people to the parish website. Give us the current address or venue.
- [ ] Direct giving link. The Support button currently opens the New Church Project page. Replace with a Zelle, PayPal, or pledge form link if you have one.
- [x] Project story, in the parish's own words from the project page
- [ ] A photo or sketch of the pedestrian steps and the wooden arch bridge, so the map version can match it.
- [ ] Confirm the map placements made from the site walk discussion: additional parking on the south-east lawn, future construction zone in the north-west corner, septic field south of the loop. All three move in one line each in assets/js/iso-map.js.
- [ ] Prize wording for the kids tour (config.js, prizeText). Current: Show this screen at the campus tour to claim your prize.
- [ ] Dates for the timeline entries: General Body approval, land purchase, property blessing and Phase 1 groundbreaking, rectory blessing, Manor sale. Also what Phase 1 covers (church or CCD building first) and the target completion.

## 3. Facts to verify or fill (data.js, marked PLACEHOLDER)

Church
- [ ] Architectural description (stone, arches, statue) matches the final design
- [ ] Seats: 400 (from site plan, confirm)
- [ ] Any dedication date or patron feast details to add

CCD building
- [ ] Number of classrooms
- [ ] Hall capacity for events
- [ ] Planned uses (catechism, youth, feasts, meals)

Basketball courts
- [ ] Surface type and whether lighting is planned
- [ ] Two courts 60 by 30 ft (from site plan, confirm)

Parking
- [ ] Exact number of spaces and accessible spaces (site plan bays add up to roughly 110 to 120)
- [ ] Gate hours, if the gate will be closed at times

Detention pond
- [ ] Depth stated as 3 to 4 ft and bridge length as 20 ft, from the site walk. Confirm.

## 4. Game content (optional but nice)

- [ ] Additional trivia questions about the parish, Syro-Malabar liturgy, or Kerala saints (data.js, `trivia`)
- [ ] Review the five St. Alphonsa facts revealed during the Treasure Hunt (data.js, `hunt`)
- [ ] Word Search words: add parish-specific words in ALL CAPS, 3 to 11 letters (data.js, `wordBank`)
- [ ] Malayalam text: tell us which labels should be bilingual

## 5. Event screens at the kids tour

Open the site with `?event=1` on the end of the address (for example `https://your-site.replit.app/?event=1`) on the TVs or tablets at the venue. That hides the header and the sections below the map, enlarges the labels and buttons, and resets the passport for the next child after two minutes with no touches (change eventIdleSeconds in config.js).

## 6. Certificate and rewards

- [ ] The Passport certificate says to show it to a greeter for a small gift. Confirm this is wanted, or tell us new wording (common.js, `openPassport`).
