# Rough Draft Creatives: Direction Four, The Unfolding

White, because the brand already is. Their logo is ink on a crumpled sheet of
ruled paper, so this build makes that sheet real: a piece of geometry, lit by one
key light, printed with their ruled page and red margin rule, and folded by
whatever section you are reading.

```
index.html            the page, nine sections
styles.css            design system and layout
app.js                the paper, the opening, and all page behaviour
vendor/three.min.js   three.js r149, served locally (MIT, licence alongside)
assets/               artwork, photographs and subset fonts
```

No build step. No CDN. No dependency beyond the folder.

## The opening

A crumpled ball of paper, slowly turning, with the motto printed across it and
creased out of legibility. Over about three and a half seconds it uncrumples, the
writing straightens and becomes readable, the camera settles, and the flattened
sheet becomes the surface the rest of the site is printed on.

Nothing about it is a video or a sprite sheet. It is the same mesh the whole way
through, moving from a sphere back to a plane.

Skippable by button, Escape, Enter or Space. It does not play on deep links,
mid-page returns, or with reduced motion.

## What the paper does

Each section carries a `data-state`. The sheet changes physical state to match:

| Section | The sheet |
| ------- | --------- |
| Arrival | flat, faintly creased, one corner lifting |
| About | settling, a soft wave across it |
| Equation | the page itself is the beam, and tilts |
| Poetry | the bottom corner curls up off the surface |
| Events | folded into three panels, like a letter |
| Community | many small creases, many hands |
| Anthology | the cover drawing prints onto the page |
| Ahead | lifts and tilts away into perspective |
| Leave a draft | pressed perfectly flat and blank |
| Closing | crumples back into a ball, to the right of the words |

The closing crumple is deliberate. The site ends by making a new rough draft out
of itself.

## The equation

Five terms. The page holds still no matter what you put on it until Motion is
switched on, because an idea without motion stays a possibility. Then the whole
sheet tips like a beam. Words tip it one way, emotions the other. Keep that rule.

## Adding content

Top of `app.js`, identical across all four directions, so content moves between
them without rewriting:

```js
var SUBMIT_ENDPOINT = '';
var SUBMIT_EMAIL    = 'reignseth2025@outlook.com';
var EVENTS = [];   // { date, time, format, place, link }
var PIECES = [];   // { no, title, credit, stanzas, audio, artwork, alt, note }
```

## The colour

One family of whites, separated by light rather than by tint: `#FFFFFF` for
highlight, `#FBFAF7` for the page, `#F4F2EC` recessed. The shading on the paper is
real lighting on real geometry, not a gradient, which is why it never bands.

Five pigments, all placed at the same value so none of them shouts: a brick red,
a navy, a dark ochre, a moss and a plum. Each is tied to a meaning rather than
used decoratively. Every one meets WCAG AA on the page white.

Typography is Fraunces for display, using its SOFT and WONK axes so the curves are
slightly irregular rather than machine-perfect, Familjen Grotesk for reading, and
Martian Mono for small technical labels only.

## Fallbacks

- **Reduced motion:** no opening, no animation, sheet holds one state.
- **No WebGL:** canvas stays empty, page reads as a clean white editorial site, and the flat cover image reappears in the Anthology section.
- **No JavaScript:** every word is in the markup and fully visible.
- **Failsafe:** if the script dies mid-load, CSS restores the content after 14 seconds.

## Performance

One mesh, one draw call, one material. The displacement and the lighting run in
the shader. Mesh resolution and texture size drop automatically below 760px. The
loop pauses when the tab is hidden.

Normals are computed by sampling the displacement three times per vertex, which is
the expensive part. If a low-end phone struggles, reduce the segment counts in
`measure()` (`190 x 136` on desktop, `104 x 76` on mobile).

`?snap` on the URL makes state changes instant, for screenshots and QA.

## Before launch

1. Point `canonical`, `og:url` and `og:image` at the real domain.
2. Set `SUBMIT_ENDPOINT`, or move `SUBMIT_EMAIL` to the client's own domain.
3. Serve over HTTPS with compression. `three.min.js` compresses from 600KB to roughly 150KB.
