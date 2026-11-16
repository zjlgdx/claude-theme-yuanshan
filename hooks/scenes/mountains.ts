// Far Mountains. Five ridges in depth, each drifting against the next as the
// view slowly pans; the far peaks carry snow, the moon rims every crest, a sea
// of cloud flows through the valleys and an aurora shimmers overhead, its rays
// running along the curtain. By day the aurora gives way to a flock of birds.
//
// As the context window fills, night deepens: the moon climbs, more stars come
// out, and near the end dawn warms the horizon. While Claude works the hut's
// window is lit, its chimney smokes, the aurora flares and shooting stars fall.

import { animate, cloud, crestOf, frame, H, hut, meteors, n1, orb, palette, random, ridgePath, starField, W } from './shared'
import type { Live, Ridge } from './shared'

// Far to near. Far ridges are tall and creased; near ones are low wooded hills.
const RIDGES: readonly Ridge[] = [
  { seed: 11, base: 640, height: 230, scale: 300, octaves: 6, sharp: 0.75, pines: 0 },
  { seed: 23, base: 715, height: 190, scale: 330, octaves: 6, sharp: 0.6, pines: 0 },
  { seed: 37, base: 790, height: 160, scale: 300, octaves: 5, sharp: 0.4, pines: 0 },
  { seed: 53, base: 860, height: 120, scale: 340, octaves: 4, sharp: 0.2, pines: 120 },
  { seed: 71, base: 930, height: 100, scale: 420, octaves: 3, sharp: 0.1, pines: 70, pineHeight: 30 },
]

const PATHS = RIDGES.map(ridgePath)
const HUT_X = 1235
const HUT_Y = crestOf(RIDGES[4] as Ridge)(HUT_X) + 4
const stars = starField(1907, 260, 600)

// A curtain of the aurora: the band its rays are seen through.
const curtain = (seed: number, foot: number, tall: number) => {
  let low = ''
  let high = ''

  for (let x = -300; x <= W + 300; x += 40) {
    const wave = Math.sin(x / 240 + seed) * 34 + Math.sin(x / 90 + seed * 2.3) * 12
    const reach = tall * (0.7 + 0.3 * Math.sin(x / 170 + seed * 1.7))
    low += `L${x},${n1(foot + wave)}`
    high = `L${x},${n1(foot + wave - reach)}${high}`
  }

  return `M${low.slice(1)}${high}Z`
}

// The rays themselves: thin upright bars of uneven brightness, one tile drawn
// twice so they can run along the curtain without a seam.
const rays = (seed: number, id: string) => {
  const next = random(seed)
  let tile = ''

  for (let x = 0; x < W + 600; ) {
    const w = 5 + next() * 30

    tile += `<rect x="${Math.round(x)}" y="40" width="${Math.round(w)}" height="520" opacity="${n1(0.12 + next() ** 2 * 0.88)}"/>`
    x += w + next() * 16
  }

  return `<g id="${id}" fill="url(#au)">${tile}</g><use href="#${id}" x="${W + 600}"/>`
}

const CURTAINS = [
  { d: curtain(1.3, 390, 300), rays: rays(71, 'ray0') },
  { d: curtain(4.1, 320, 240), rays: rays(72, 'ray1') },
  { d: curtain(7.7, 440, 220), rays: rays(73, 'ray2') },
]

// A small flock, each bird a pair of wings that beat.
const BIRDS = (() => {
  const next = random(88)

  return Array.from({ length: 7 }, (_, i) => {
    const x = (i % 2 === 0 ? -1 : 1) * Math.ceil(i / 2) * 26 + next() * 8
    const y = Math.ceil(i / 2) * 15 + next() * 6

    return `<g transform="translate(${n1(x)} ${n1(y)})"><path class="wing fb${i % 3}" d="M-9,0q4.5,-7 9,0q4.5,-7 9,0"/></g>`
  }).join('')
})()

const DEFS =
  `<radialGradient id="dawn"><stop offset="0" class="w" stop-opacity="1"/><stop offset=".5" class="w" stop-opacity=".35"/><stop offset="1" class="w" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a7ff0" stop-opacity="0"/><stop offset=".35" stop-color="#7f9cf0" stop-opacity=".3"/><stop offset=".7" stop-color="#5fe0b0" stop-opacity=".75"/><stop offset=".9" stop-color="#9af5c4" stop-opacity=".95"/><stop offset="1" stop-color="#c8ffe0" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="peak" gradientUnits="userSpaceOnUse" x1="0" y1="405" x2="0" y2="500"><stop offset="0" class="pk" stop-opacity=".32"/><stop offset="1" class="pk" stop-opacity="0"/></linearGradient>` +
  `<filter id="soft-au" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="9 5"/></filter>` +
  CURTAINS.map((c, i) => `<clipPath id="cur${i}"><path d="${c.d}"/></clipPath>`).join('')

export const mountains = (live: Live) => {
  const a = animate(live.now)
  const { t } = live
  const shooting = meteors(a, live.isBusy)
  const style = `${palette(
    '--sky0:#070d22;--sky1:#101a3a;--sky2:#1d2f56;--sky3:#3a4a72;--r0:#40527e;--r1:#31436e;--r2:#24345a;--r3:#172444;--r4:#0b1428;--rim:#a9cdf0;--pk:#dfe8fb;--hut:#060b18;--mist:#b6c6e8;--haze:.3;--orb:#f1ead0;--glow:#cfd9ee;--dawn:#e3956a;--star:1;--day:0;--mare:.07',
    '--sky0:#8fb7dc;--sky1:#b3d0e8;--sky2:#d8e4ea;--sky3:#f5e4cf;--r0:#a3bbd8;--r1:#8ba6c8;--r2:#7392b6;--r3:#5a7c9e;--r4:#416585;--rim:#ffffff;--pk:#ffffff;--hut:#2a475f;--mist:#f6f6f0;--haze:.45;--orb:#fff3cf;--glow:#ffe2a0;--dawn:#f3c090;--star:0;--day:1;--mare:0',
  )}
.r0{fill:var(--r0)}.r1{fill:var(--r1)}.r2{fill:var(--r2)}.r3{fill:var(--r3)}.r4{fill:var(--r4)}
.rimline{fill:none;stroke:var(--rim);stroke-linejoin:round}.pk{stop-color:var(--pk)}
.w{stop-color:var(--dawn)}.haze{opacity:var(--haze)}
.aur{opacity:calc(var(--star)*${live.isBusy ? 1 : 0.62})}
${a('.sway0', 'au', 11, { alt: true })}${a('.sway1', 'au', 15, { alt: true, off: 0.4, rev: true })}${a('.sway2', 'au', 19, { alt: true, off: 0.7 })}
.sway0,.sway1,.sway2{transform-origin:800px 520px}
@keyframes au{0%{transform:translateX(-70px) skewX(-8deg) scaleY(.86);opacity:.5}50%{opacity:1}100%{transform:translateX(70px) skewX(8deg) scaleY(1.14);opacity:.6}}
${a('.run0', 'run', live.isBusy ? 28 : 46, { ease: 'linear' })}${a('.run1', 'run', live.isBusy ? 37 : 61, { ease: 'linear', rev: true, off: 0.3 })}${a('.run2', 'run', live.isBusy ? 23 : 39, { ease: 'linear', off: 0.6 })}
@keyframes run{from{transform:translateX(0)}to{transform:translateX(-${W + 600}px)}}
.flock{opacity:var(--day)}.wing{fill:none;stroke:var(--r4);stroke-width:2.4;stroke-linecap:round;transform-box:fill-box;transform-origin:center}
${a('.flock', 'fly', 44, { ease: 'linear' })}@keyframes fly{from{transform:translate(-160px,60px)}to{transform:translate(1800px,-90px)}}
${a('.fb0', 'flap', 0.62, { alt: true })}${a('.fb1', 'flap', 0.7, { alt: true, off: 0.3 })}${a('.fb2', 'flap', 0.56, { alt: true, off: 0.6 })}
@keyframes flap{from{transform:scaleY(1)}to{transform:scaleY(-.45)}}
${shooting.css}`

  const dawn = `<ellipse cx="620" cy="650" rx="950" ry="190" fill="url(#dawn)" opacity="${n1(0.22 + Math.max(0, t - 0.75) * 2)}"/>`
  const aurora = `<g class="aur">${CURTAINS.map((c, i) => `<g class="sway${i}" filter="url(#soft-au)"><g clip-path="url(#cur${i})"><g class="run${i}">${c.rays}</g></g></g>`).join('')}</g>`
  // Between ridges, haze: thinner as the day or the night clears.
  const haze = n1(1 - 0.35 * t)
  const seas = [
    '',
    `<ellipse class="wisp3" cx="0" cy="722" rx="520" ry="34" fill="url(#fog)"/><ellipse class="f1" cx="420" cy="735" rx="620" ry="70" fill="url(#fog)"/>`,
    `<ellipse class="wisp2" cx="0" cy="800" rx="600" ry="40" fill="url(#fog)"/><ellipse class="f2" cx="1180" cy="810" rx="700" ry="80" fill="url(#fog)"/>`,
    `<ellipse class="wisp1" cx="0" cy="876" rx="560" ry="38" fill="url(#fog)"/><ellipse class="f3" cx="640" cy="890" rx="760" ry="80" fill="url(#fog)"/>`,
    '',
  ]
  const layers = RIDGES.map((ridge, i) => {
    const top = ridge.base - ridge.height * 0.9
    const d = PATHS[i] ?? ''
    const veil =
      i < RIDGES.length - 1 ? `<rect class="haze" x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#haze)"/>` : ''
    const home = i === RIDGES.length - 1 ? hut(HUT_X, HUT_Y, 1.25, live.isBusy) : ''
    // Snow above the snowline on the far peaks; the moon along every crest.
    const peaks = i === 0 ? `<path d="${d}" fill="url(#peak)"/>` : ''
    const rim = i < 3 ? `<path class="rimline" d="${d}" stroke-width="${n1(2.4 - i * 0.4)}" opacity="${n1(0.5 - i * 0.09)}"/>` : ''
    const body = `<path class="r${i}" d="${d}"/>${peaks}${rim}`

    return `${i < 4 ? `<g class="px${i + 1}">${body}</g>` : body}${home}<g opacity="${haze}">${veil}${seas[i] ?? ''}</g>`
  }).join('')

  return frame(
    live,
    a,
    style,
    DEFS,
    `<g class="stars">${stars(t)}${shooting.markup}</g>${aurora}${dawn}${orb(n1(1230 - 80 * t), n1(470 - 300 * t ** 0.85), 32)}` +
      `<g class="flock"><g transform="translate(0 300)">${BIRDS}</g></g>` +
      `${cloud(1, 250, 1, 0.55)}${cloud(2, 170, 0.7, 0.45)}${cloud(3, 350, 1.2, 0.5)}${layers}`,
  )
}
