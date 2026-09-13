# Mentalist site: positioning brief and prototype

Single file prototype: `index.html`. No build step. Drop it on any static host
(GitHub Pages, Netlify, Cloudflare Pages) and it runs.

## The thesis

A performer's fee is set by the buyer's anchor, not by the act. Buyers of
corporate entertainment anchor on what they have seen before: a magician at an
annual day, a band, an emcee. To move the anchor the buyer has to experience the
product before the call, and the product is the feeling of being read.

So the site does not describe the act. It performs it.

## Why the mini experience beats a hype animation or a game

| Option | What the buyer feels | Effect on fee |
| --- | --- | --- |
| Hype reel with animation | Impressed by production | Table stakes. Every mid tier act has one. |
| Game | Entertained, in control | Frames him as a toy. Pushes the fee down. |
| Deterministic mind read | Read, slightly unsettled, curious | The buyer becomes an audience member. The fee is now for a feeling they had. |

The experience must never miss. Everything in it is self working: the
arithmetic always resolves to four, and the six cards are replaced by five
different cards so whichever one was chosen is gone. Zero typing, zero chance of
a wrong reveal.

## The fee levers built into the page

1. **Sealed prediction before the experience.** The envelope is on the page from
   the first frame, so the reveal reads as prediction and not as reaction.
2. **No price, no Book Now.** The only call to action is Check availability.
   Price appears only as a budget band inside the enquiry form, with the lowest
   band already high. That is the anchor.
3. **Formats named by room, not by act.** Stage, Dinner, Boardroom. The buyer
   picks a room size and the fee follows the room.
4. **Scarcity as a number.** Twenty four nights a year. Update the month strip
   monthly. Held dates sell the open ones.
5. **Proof is faces, not tricks.** The reel is ninety seconds of audience
   reactions. Reveals on video train the buyer to compare tricks; faces train the
   buyer to want the room.
6. **Language.** Performance not show. Guests not audience. Fee not rate. He
   replies with a yes or a no, never a maybe.
7. **Lead capture inside the trick.** Send me the envelope collects an email at
   the peak of curiosity. That list converts far better than a contact form.

## Before launch

- Replace the wordmark with his name and add a portrait or a still from a show.
- Replace the three sample quotes with real ones, role and company named.
- Embed the reactions reel. Cut for faces, ninety seconds, no reveals.
- Wire both forms to a CRM or form endpoint. HubSpot Forms works with a single
  script tag; the submit handlers are marked in the script.
- Adjust the budget bands to two times his current fee as the second band.
- Set real availability in the month strip and keep it honest.
- Add analytics events for: experience started, reveal reached, envelope
  requested, enquiry submitted. The reveal rate is the number that matters.

## Design notes

Committed dark theme: velvet plum black ground, brass accent, paper slip.
Type: Bodoni Moda italic for the voice, Instrument Sans for interface, Special
Elite for the prediction slip. Fonts load from Google Fonts with system
fallbacks. Motion respects `prefers-reduced-motion`.
