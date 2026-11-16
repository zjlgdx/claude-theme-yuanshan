// Rain. A storm over a lake at night. Two decks of cloud roll overhead, the
// rain falls in three depths and leans with the gusts, every drop that lands
// opens a ring on the water, and the hills stand doubled in the lake. Now and
// then lightning lights the cloud from inside.
//
// As the context window fills the rain thickens from a shower to a downpour
// and the rings crowd the lake. While Claude works the hut's window is lit and
// lies as a streak on the water, the chimney smokes, and the storm comes
// closer: lightning strikes on both sides, and more often.

import { animate, crestOf, frame, H, hut, n1, palette, random, ridgePath, W } from './shared'
import type { Live, Ridge } from './shared'

const RIDGES: readonly Ridge[] = [
  { seed: 211, base: 610, height: 170, scale: 420, octaves: 5, sharp: 0.5, pines: 0 },
  { seed: 223, base: 690, height: 150, scale: 380, octaves: 5, sharp: 0.3, pines: 0 },
  { seed: 239, base: 775, height: 120, scale: 340, octaves: 4, sharp: 0.2, pines: 120 },
]
const BANK: Ridge = { seed: 251, base: 940, height: 78, scale: 520, octaves: 3, sharp: 0, pines: 46, pineHeight: 34 }

const PATHS = RIDGES.map(ridgePath)
const BANK_PATH = ridgePath(BANK)
const LAKE = 782
const HUT_X = 1240
const HUT_Y = crestOf(BANK)(HUT_X) + 4

// Three depths of rain. A layer is one tile of streaks drawn twice, a tile
// apart, falling by exactly one tile: the loop has no seam.
const LAYERS = [
  { seed: 5, most: 190, length: 30, lean: 6, width: 1, opacity: 0.5, seconds: 1.4 },
  { seed: 6, most: 130, length: 56, lean: 11, width: 1.4, opacity: 0.75, seconds: 0.95 },
  { seed: 7, most: 70, length: 96, lean: 19, width: 2, opacity: 1, seconds: 0.66 },
] as const

const STREAKS = LAYERS.map(layer => {
  const next = random(layer.seed)

  return Array.from(
    { length: layer.most },
    () => `M${Math.round(next() * (W + 300))},${Math.round(next() * H)}l${-layer.lean},${layer.length}`,
  )
})

// A deck of storm cloud: a ceiling with a billowing underside, one tile wide.
const deck = (seed: number, foot: number, small: number, big: number) => {
  const next = random(seed)
  let puffs = ''

  for (let x = 0; x < W; ) {
    const r = small + next() * (big - small)

    puffs += `<circle cx="${Math.round(x)}" cy="${Math.round(foot - r * 0.5 + next() * 40)}" r="${Math.round(r)}"/>`
    x += r * (0.7 + next() * 0.5)
  }

  return `<rect y="-60" width="${W}" height="${foot - 20}"/>${puffs}`
}

const DECKS = [deck(31, 250, 70, 130), deck(37, 185, 60, 120)]

// Where drops land on the lake.
const RINGS = (() => {
  const next = random(59)

  return Array.from({ length: 60 }, (_, i) => {
    const y = LAKE + 14 + next() ** 1.4 * 120
    const rx = 10 + ((y - LAKE) / 120) * 22 + next() * 8

    return `<ellipse class="ring rg${i % 6}" cx="${Math.round(next() * W)}" cy="${Math.round(y)}" rx="${n1(rx)}" ry="${n1(rx * 0.26)}"/>`
  })
})()

const bolt = (x: number, y: number, seed: number) => {
  const next = random(seed)
  let d = `M${x},${y}`
  let fork = ''

  for (let i = 0; i < 8; i += 1) {
    const dx = Math.round((next() - 0.5) * 60)

    d += `l${dx},${Math.round(26 + next() * 22)}`

    if (i === 3) {
      fork = `${d}l${dx > 0 ? -44 : 44},30l${dx > 0 ? -18 : 18},34`
    }
  }

  return `<path class="bolt" d="${d}"/><path class="bolt" stroke-width="1.6" d="${fork}"/>`
}

const DEFS =
  `<linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="l0"/><stop offset="1" class="l1"/></linearGradient>` +
  `<radialGradient id="flash"><stop offset="0" stop-color="#eaf2ff" stop-opacity=".95"/><stop offset=".4" stop-color="#a9c4ff" stop-opacity=".45"/><stop offset="1" stop-color="#a9c4ff" stop-opacity="0"/></radialGradient>` +
  `<clipPath id="water"><rect y="${LAKE}" width="${W}" height="${H - LAKE}"/></clipPath>`

export const rain = (live: Live) => {
  const a = animate(live.now)
  const { t, isBusy } = live
  const style = `${palette(
    '--sky0:#0a1222;--sky1:#13213a;--sky2:#213c58;--sky3:#3d6474;--r0:#2c4962;--r1:#213a52;--r2:#152940;--bank:#0a1626;--cl0:#1b2d47;--cl1:#0e1a2e;--l0:#2a4c64;--l1:#0c1a2c;--hut:#060c16;--mist:#9fc0cf;--haze:.34;--rain:#d3e6fa;--ro:.42;--ring:#bfe0f2;--bolt:1',
    '--sky0:#5d8196;--sky1:#7fa2b1;--sky2:#a9c6c9;--sky3:#d5e3d8;--r0:#8fb0b8;--r1:#6c95a1;--r2:#4a7b86;--bank:#2f5d68;--cl0:#8aa5b1;--cl1:#67889a;--l0:#9cc0c6;--l1:#5f8e9c;--hut:#24454f;--mist:#e7f0ea;--haze:.5;--rain:#f4fbff;--ro:.7;--ring:#ffffff;--bolt:.7',
  )}
.r0{fill:var(--r0)}.r1{fill:var(--r1)}.r2{fill:var(--r2)}.bank{fill:var(--bank)}
.cl0{fill:var(--cl0)}.cl1{fill:var(--cl1)}.l0{stop-color:var(--l0)}.l1{stop-color:var(--l1)}
.haze{opacity:var(--haze)}
.rain{fill:none;stroke:var(--rain);stroke-linecap:round;opacity:var(--ro)}
${LAYERS.map((layer, i) => a(`.p${i}`, 'fall', layer.seconds, { ease: 'linear', off: i * 0.3 })).join('')}
@keyframes fall{to{transform:translateY(${H}px)}}
${a('.gust', 'gust', 7, { alt: true })}@keyframes gust{from{transform:skewX(-3deg)}to{transform:skewX(7deg)}}.gust{transform-origin:800px 0}
${a('.dk0', 'roll', 150, { ease: 'linear' })}${a('.dk1', 'roll', 90, { ease: 'linear', off: 0.4 })}@keyframes roll{to{transform:translateX(-${W}px)}}
.ring{fill:none;stroke:var(--ring);stroke-width:1.6;transform-box:fill-box;transform-origin:center;opacity:0}
${[0, 1, 2, 3, 4, 5].map(i => a(`.rg${i}`, 'ring', 1.5 + i * 0.23, { ease: 'ease-out', off: i * 0.17 })).join('')}
@keyframes ring{0%{opacity:0;transform:scale(.1)}15%{opacity:.75}100%{opacity:0;transform:scale(1.25)}}
.bolt{fill:none;stroke:#f2f6ff;stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.lg1,.lg2{opacity:0}
${a('.lg1', 'strike', isBusy ? 8 : 17, { ease: 'linear' })}${isBusy ? a('.lg2', 'strike', 11, { ease: 'linear', off: 0.45 }) : ''}
@keyframes strike{0%,90%{opacity:0}91%{opacity:var(--bolt)}92.5%{opacity:.12}94%{opacity:calc(var(--bolt)*.85)}97%,100%{opacity:0}}
${a('.shim', 'shim', 5, { alt: true })}@keyframes shim{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
.glintline{stroke:var(--ring);stroke-width:1.4;stroke-linecap:round;opacity:.28}`

  const hills = RIDGES.map((ridge, i) => {
    const top = ridge.base - ridge.height
    const fog = i === 1 ? `<ellipse class="f2" cx="1100" cy="720" rx="760" ry="70" fill="url(#fog)"/>` : ''

    return `<g class="px${i + 1}"><path class="r${i}" d="${PATHS[i] ?? ''}"/></g><rect class="haze" x="0" y="${top}" width="${W}" height="${LAKE - top}" fill="url(#haze)"/>${fog}`
  }).join('')

  const strike = (name: string, x: number, seed: number) =>
    `<g class="${name}"><circle cx="${x}" cy="300" r="330" fill="url(#flash)"/>${bolt(x, 300, seed)}</g>`
  const decks =
    `<g class="dk0 cl0"><g id="dk0">${DECKS[0] ?? ''}</g><use href="#dk0" x="${W}"/></g>` +
    strike('lg1', 1215, 3) +
    (isBusy ? strike('lg2', 300, 9) : '') +
    `<g class="dk1 cl1"><g id="dk1">${DECKS[1] ?? ''}</g><use href="#dk1" x="${W}"/></g>`

  // The lake: the hills upside down in it, lines of light that slide, and rings.
  const next = random(83)
  const lines = Array.from({ length: 34 }, () => {
    const y = LAKE + 8 + next() * 130

    return `M${Math.round(next() * W)},${Math.round(y)}h${Math.round(30 + next() * 90)}`
  }).join('')
  const rings = RINGS.slice(0, Math.round(RINGS.length * (0.3 + 0.7 * t))).join('')
  const lit = isBusy
    ? `<ellipse class="flick" cx="${HUT_X - 60}" cy="${n1(HUT_Y - 18)}" rx="26" ry="70" fill="url(#lampglow)" clip-path="url(#water)"/>`
    : ''
  const lake =
    `<rect y="${LAKE}" width="${W}" height="${H - LAKE}" fill="url(#lake)"/>` +
    `<g clip-path="url(#water)"><use href="#hills" transform="translate(0 ${2 * LAKE}) scale(1 -1)" opacity=".42"/>` +
    `<path class="glintline shim" d="${lines}"/>${rings}</g>`

  const fall = LAYERS.map((layer, i) => {
    const count = Math.round(layer.most * (0.3 + 0.7 * t))
    const tile = `<path id="rn${i}" d="${(STREAKS[i] ?? []).slice(0, count).join('')}"/>`

    return `<g class="rain p${i}" stroke-width="${layer.width}" stroke-opacity="${layer.opacity}">${tile}<use href="#rn${i}" y="${-H}"/></g>`
  }).join('')

  return frame(
    live,
    a,
    style,
    DEFS,
    `<g id="hills">${hills}</g>${decks}${lake}<path class="bank" d="${BANK_PATH}"/>${lit}${hut(HUT_X, HUT_Y, 1.25, isBusy)}` +
      `<ellipse class="wisp2" cx="0" cy="${LAKE + 6}" rx="520" ry="22" fill="url(#fog)"/><g class="gust">${fall}</g>`,
  )
}
