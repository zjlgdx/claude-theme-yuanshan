// Snow. It snows all the time, in four depths, and harder as the context
// window fills; the snow lies heavier on the big pine and thicker on the roof,
// until a compact shakes it off. The far ridges drift against the near ones,
// spindrift runs along the ground, the snowfield glitters, and now and then a
// clump slides off a bough.
//
// While Claude works: the lights on the pine chase each other, the star on its
// tip turns its rays, the cabin window is lit with someone pacing inside, warm
// light lies on the snow, the chimney smokes harder and shooting stars fall.
//
// The pine and the cabin stand at the two sides, clear of the column of words
// in the middle, and above the foot of the window that a wide screen crops.

import { animate, crestOf, frame, H, meteors, n1, orb, palette, random, ridgePath, starField, W } from './shared'
import type { Live, Ridge } from './shared'

const RIDGES: readonly Ridge[] = [
  { seed: 401, base: 640, height: 190, scale: 300, octaves: 6, sharp: 0.7, pines: 0 },
  { seed: 409, base: 700, height: 130, scale: 360, octaves: 5, sharp: 0.45, pines: 0 },
  { seed: 419, base: 770, height: 70, scale: 420, octaves: 3, sharp: 0.1, pines: 130, pineHeight: 26 },
]
const BACK: Ridge = { seed: 431, base: 800, height: 34, scale: 620, octaves: 2, sharp: 0, pines: 0 }
const FRONT: Ridge = { seed: 443, base: 868, height: 44, scale: 520, octaves: 2, sharp: 0, pines: 0 }

const PATHS = RIDGES.map(ridgePath)
const BACK_PATH = ridgePath(BACK)
const FRONT_PATH = ridgePath(FRONT)
const front = crestOf(FRONT)
const stars = starField(5501, 190, 520)

// Four depths of snowfall, far to near. A layer is one tile of flakes drawn
// twice, a tile apart, falling by exactly one tile: the loop has no seam. The
// nearest flakes are large and soft, out of focus in front of the lens.
const LAYERS = [
  { seed: 15, most: 220, size: 1.7, opacity: 0.6, seconds: 17, soft: false, sway: 18 },
  { seed: 16, most: 150, size: 2.9, opacity: 0.85, seconds: 11.5, soft: false, sway: 30 },
  { seed: 17, most: 80, size: 4.6, opacity: 1, seconds: 7.5, soft: false, sway: 46 },
  { seed: 18, most: 22, size: 13, opacity: 0.6, seconds: 4.6, soft: true, sway: 80 },
] as const

const FLAKES = LAYERS.map(layer => {
  const next = random(layer.seed)

  return Array.from({ length: layer.most }, () => {
    const r = n1(layer.size * (0.6 + next() * 0.7))

    return `<circle cx="${n1(next() * W)}" cy="${n1(next() * H)}" r="${r}"${layer.soft ? ' fill="url(#soft)"' : ''}/>`
  })
})

// Glints on the snowfield, where a crystal catches the moon.
const GLINTS = (() => {
  const next = random(977)

  return Array.from({ length: 70 }, (_, i) => {
    const x = next() * W
    const y = Math.min(912, front(x) + 8 + next() * 90)
    const r = 1 + next() * 1.8

    return `<path class="glint t${1 + (i % 4)}" transform="translate(${n1(x)} ${n1(y)})" d="M0,${n1(-r * 2.4)}L${n1(r * 0.5)},${n1(-r * 0.5)}L${n1(r * 2.4)},0L${n1(r * 0.5)},${n1(r * 0.5)}L0,${n1(r * 2.4)}L${n1(-r * 0.5)},${n1(r * 0.5)}L${n1(-r * 2.4)},0L${n1(-r * 0.5)},${n1(-r * 0.5)}Z"/>`
  }).join('')
})()

// The big pine, under the sign: five tiers of boughs, the snow each carries,
// and a string of lights.
const TREE_X = 212
const TREE_FOOT = front(TREE_X) + 10
const BULBS = ['#ff7a6b', '#ffd166', '#7fd6ff', '#9be58a', '#ff9fd0']

const tree = (t: number, isBusy: boolean) => {
  const next = random(63)
  let boughs = ''
  let snow = ''
  let lights = ''
  let bulb = 0

  for (let i = 0; i < 5; i += 1) {
    const top = TREE_FOOT - 372 + i * 62
    const half = 40 + i * 21
    const low = top + 112
    const x = TREE_X

    // A tier with ragged tips along its hem; its left half lies in shadow and
    // the moon, at the right, picks out a rim along the other edge.
    boughs +=
      `<path class="pine" d="M${x},${top}L${x + half},${low}l${-half * 0.22},-7l${-half * 0.1},13l${-half * 0.24},-9l${-half * 0.14},14l${-half * 0.3},-10l${-half * 0.3},10l${-half * 0.14},-14l${-half * 0.24},9l${-half * 0.1},-13l${-half * 0.22},7Z"/>` +
      `<path class="shade" d="M${x},${top}L${x - half},${low}l${half * 0.22},-7l${half * 0.1},13l${half * 0.24},-9l${half * 0.14},14l${half * 0.3},-10Z"/>` +
      `<path class="rim" d="M${x + 3},${top + 8}L${x + half - 4},${low - 4}"/>`

    // Snow settles on each tier from its tip down, heavier as the window fills.
    const load = Math.max(0.12, Math.min(1, 0.12 + t * 1.1))
    const reach = half * (0.24 + 0.38 * load)
    const y = top + (112 * reach) / half
    const thick = 5 + 15 * load

    snow +=
      `<path class="snowc" d="M${x},${n1(top - 3 - 4 * load)}L${n1(x + reach)},${n1(y)}q${n1(-reach * 0.16)},${n1(thick)} ${n1(-reach * 0.34)},${n1(thick * 0.2)}q${n1(-reach * 0.16)},${n1(thick * 1.2)} ${n1(-reach * 0.34)},${n1(thick * 0.1)}q${n1(-reach * 0.16)},${n1(thick * 1.3)} ${n1(-reach * 0.32)},0q${n1(-reach * 0.16)},${n1(thick * 1.2)} ${n1(-reach * 0.34)},${n1(-thick * 0.1)}q${n1(-reach * 0.16)},${n1(thick)} ${n1(-reach * 0.34)},${n1(-thick * 0.2)}Z"/>` +
      `<path class="snowshade" d="M${x},${n1(top - 3 - 4 * load)}L${n1(x - reach)},${n1(y)}q${n1(reach * 0.16)},${n1(thick)} ${n1(reach * 0.34)},${n1(thick * 0.2)}q${n1(reach * 0.16)},${n1(thick * 1.2)} ${n1(reach * 0.34)},${n1(thick * 0.1)}q${n1(reach * 0.16)},${n1(thick * 1.3)} ${n1(reach * 0.32)},0Z"/>`

    for (let b = 0; b < 3 + i; b += 1) {
      const u = (b + 0.5) / (3 + i)
      const bx = x - half * 0.72 + u * half * 1.44
      const by = low - 16 - Math.sin(u * Math.PI) * 9 + next() * 5
      const color = BULBS[(i + b) % BULBS.length] ?? '#ffd166'

      // Lit, the bulbs run a chase down the string, one after the next.
      lights += isBusy
        ? `<g class="ch${bulb % 6}"><circle cx="${n1(bx)}" cy="${n1(by)}" r="15" fill="${color}" opacity=".3"/><circle cx="${n1(bx)}" cy="${n1(by)}" r="4.6" fill="${color}"/><circle cx="${n1(bx - 1.2)}" cy="${n1(by - 1.4)}" r="1.5" fill="#fff" opacity=".8"/></g>`
        : `<circle cx="${n1(bx)}" cy="${n1(by)}" r="3.6" fill="${color}" opacity=".45"/>`
      bulb += 1
    }
  }
  const tip = TREE_FOOT - 378
  const rays = isBusy
    ? `<g class="rays" style="transform-origin:${TREE_X}px ${n1(tip)}px">${Array.from({ length: 8 }, (_, i) => `<rect class="win" x="${TREE_X - 1}" y="${n1(tip - 44)}" width="2" height="24" rx="1" opacity=".7" transform="rotate(${i * 45} ${TREE_X} ${n1(tip)})"/>`).join('')}</g>`
    : ''
  const star =
    `${rays}<g class="${isBusy ? 'flick' : 'unlit2'}"><circle cx="${TREE_X}" cy="${tip}" r="40" fill="url(#lampglow)"/>` +
    `<path class="win" transform="translate(${TREE_X} ${tip})" d="M0,-15L4,-5L15,-5L6,2L9,13L0,6L-9,13L-6,2L-15,-5L-4,-5Z"/></g>`
  // Now and then a clump lets go of a bough and bursts on the ground.
  const clumps =
    `<g class="clump k1"><ellipse class="snowc" cx="${TREE_X + 58}" cy="${n1(TREE_FOOT - 150)}" rx="11" ry="7"/></g>` +
    `<ellipse class="puff k1p snowc" cx="${TREE_X + 58}" cy="${n1(TREE_FOOT + 4)}" rx="16" ry="6"/>` +
    `<g class="clump k2"><ellipse class="snowc" cx="${TREE_X - 46}" cy="${n1(TREE_FOOT - 215)}" rx="9" ry="6"/></g>` +
    `<ellipse class="puff k2p snowc" cx="${TREE_X - 46}" cy="${n1(TREE_FOOT + 2)}" rx="14" ry="5"/>`

  return (
    `<ellipse class="shadow" cx="${TREE_X - 30}" cy="${n1(TREE_FOOT + 10)}" rx="130" ry="15"/>` +
    `<rect class="trunk" x="${TREE_X - 10}" y="${n1(TREE_FOOT - 26)}" width="20" height="36" rx="3"/>${boughs}${snow}${lights}${star}${clumps}`
  )
}

// The cabin at the other side: log walls, a door, a window, snow on the roof.
const CABIN_X = 1222
const CABIN_Y = front(CABIN_X) + 8

const cabin = (t: number, isBusy: boolean) => {
  const snowy = 9 + 13 * t
  const puffs = isBusy ? ['sm1', 'sm2', 'sm3', 'sm4'] : ['sm1', 'sm3']
  const smoke = puffs.map(name => `<circle class="smoke ${name}" cx="40" cy="-152" r="${isBusy ? 10 : 7}"/>`).join('')
  const inside = isBusy
    ? `<g clip-path="url(#pane)"><g class="pacer"><rect class="frame" x="-46" y="-50" width="9" height="24" rx="4"/><circle class="frame" cx="-41.5" cy="-55" r="4.5"/></g></g>`
    : ''

  return (
    `<g transform="translate(${CABIN_X} ${n1(CABIN_Y)})">` +
    `<ellipse class="shadow" cx="-20" cy="4" rx="124" ry="13"/>` +
    (isBusy
      ? `<circle class="flick" cx="-22" cy="-44" r="170" fill="url(#lampglow)"/><ellipse class="flick" cx="-70" cy="20" rx="120" ry="20" fill="url(#lampglow)"/>`
      : '') +
    smoke +
    `<rect class="brick" x="30" y="-150" width="22" height="50"/><rect class="snowc" x="26" y="${n1(-154 - snowy * 0.4)}" width="30" height="${n1(6 + snowy * 0.4)}" rx="4"/>` +
    `<path class="wall" d="M-74,0V-78L0,-136L74,-78V0Z"/><path class="wallshade" d="M-74,0V-78L0,-136V0Z"/>` +
    `<path class="log" d="M-74,-20h148M-74,-40h148M-74,-60h148M-62,-80h124M-40,-98h80"/>` +
    `<rect class="door" x="18" y="-58" width="34" height="58" rx="3"/><circle class="win" cx="26" cy="-28" r="2.6"/>` +
    `<rect class="frame" x="-52" y="-66" width="50" height="44" rx="3"/>` +
    `<g class="${isBusy ? 'flick' : 'unlit2'}"><rect class="win" x="-47" y="-61" width="40" height="34" rx="2"/></g>${inside}` +
    `<path class="frame" d="M-28,-61h2v34h-2zM-47,-45h40v2h-40z"/>` +
    // Snow on the roof, thicker as the window fills, with a scalloped eave and icicles.
    `<path class="snowc" d="M-92,-70L0,${n1(-142 - snowy)}L92,-70q-6,${n1(snowy)} -16,${n1(snowy * 0.3)}L0,${n1(-128)}L-76,${n1(-70 + snowy * 0.3)}q-10,${n1(snowy * 0.7)} -16,${n1(-snowy * 0.3)}Z"/>` +
    `<path class="snowshade" d="M-92,-70L0,${n1(-142 - snowy)}L0,-128L-76,${n1(-70 + snowy * 0.3)}q-10,${n1(snowy * 0.7)} -16,${n1(-snowy * 0.3)}Z"/>` +
    `<path class="ice" d="M-70,-66l3,14l3,-14zM-56,-77l2.5,11l2.5,-11zM58,-76l3,16l3,-16zM72,-65l2.5,10l2.5,-10z"/>` +
    `</g>`
  )
}

const DEFS =
  `<radialGradient id="dusk"><stop offset="0" class="w" stop-opacity="1"/><stop offset=".5" class="w" stop-opacity=".4"/><stop offset="1" class="w" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="drift" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="n0"/><stop offset="1" class="n1"/></linearGradient>` +
  `<linearGradient id="peak" gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="560"><stop offset="0" class="pk" stop-opacity=".9"/><stop offset="1" class="pk" stop-opacity="0"/></linearGradient>` +
  `<clipPath id="pane"><rect x="-47" y="-61" width="40" height="34" rx="2"/></clipPath>`

export const snow = (live: Live) => {
  const a = animate(live.now)
  const { t } = live
  const shooting = meteors(a, live.isBusy)
  const style = `${palette(
    '--sky0:#0d1130;--sky1:#1a1d49;--sky2:#34306c;--sky3:#6b4f86;--r0:#4d4f8e;--r1:#3c3f78;--r2:#232a57;--snow0:#c3cdf2;--snow1:#8f9bd0;--back:#a3aede;--cap:#eef2ff;--capshade:#aab6e6;--pine:#1f5a4c;--shade:#123c36;--rim:#7fd6c0;--trunk:#3a2620;--wall:#5a372d;--wallshade:#3f2620;--log:#352019;--door:#2a1814;--frame:#24140f;--brick:#5a3d38;--shadow:#3b4486;--mist:#b9c3e2;--haze:.22;--orb:#f3ecd2;--glow:#d6d9f0;--dusk:#f0a070;--flake:#f6f8ff;--star:1;--mare:.07',
    '--sky0:#86b3da;--sky1:#a9cbe6;--sky2:#cfe1ee;--sky3:#f4e6d6;--r0:#a9c0de;--r1:#8fabd0;--r2:#5f8f8a;--snow0:#fbfcff;--snow1:#d5e0f0;--back:#e6edf7;--cap:#ffffff;--capshade:#d3deef;--pine:#3f8a6c;--shade:#2c6b55;--rim:#bfe8c8;--trunk:#7a5546;--wall:#b06f54;--wallshade:#935944;--log:#8a523d;--door:#6f3f2f;--frame:#5d3527;--brick:#9a6a5e;--shadow:#a9bbd8;--mist:#f2f4f6;--haze:.35;--orb:#fff3cf;--glow:#ffe6a8;--dusk:#f7c9a0;--flake:#ffffff;--star:0;--mare:0',
  )}
.r0{fill:var(--r0)}.r1{fill:var(--r1)}.r2{fill:var(--r2)}.back{fill:var(--back)}
.n0{stop-color:var(--snow0)}.n1{stop-color:var(--snow1)}.pk{stop-color:var(--cap)}
.pine{fill:var(--pine)}.shade{fill:var(--shade)}.rim{fill:none;stroke:var(--rim);stroke-width:2.2;stroke-linecap:round;opacity:.5}
.trunk{fill:var(--trunk)}.snowc{fill:var(--cap)}.snowshade{fill:var(--capshade)}.ice{fill:var(--cap);opacity:.85}
.wall{fill:var(--wall)}.wallshade{fill:var(--wallshade)}.log{fill:none;stroke:var(--log);stroke-width:3}.door{fill:var(--door)}.frame{fill:var(--frame)}.brick{fill:var(--brick)}
.shadow{fill:var(--shadow);opacity:.35}.unlit2{opacity:.22}
.w{stop-color:var(--dusk)}.haze{opacity:var(--haze)}
.flakes{fill:var(--flake)}.glint{fill:var(--cap)}
${LAYERS.map((layer, i) => a(`.p${i}`, 'fall', layer.seconds, { ease: 'linear', off: i * 0.3 })).join('')}
@keyframes fall{to{transform:translateY(${H}px)}}
${LAYERS.map((layer, i) => `${a(`.d${i}`, `drift${i}`, 3.4 + i * 0.9, { alt: true, off: i * 0.3 })}@keyframes drift${i}{from{transform:translateX(${-layer.sway}px)}to{transform:translateX(${layer.sway}px)}}`).join('')}
${[0, 1, 2, 3, 4, 5].map(i => a(`.ch${i}`, 'chase', 1.8, { ease: 'linear', off: i / 6 })).join('')}
@keyframes chase{0%,100%{opacity:.5}16%{opacity:1}50%{opacity:.5}}
${a('.rays', 'turn', 18, { ease: 'linear' })}@keyframes turn{to{transform:rotate(360deg)}}
${a('.pacer', 'pace', 7)}@keyframes pace{0%,12%{transform:translateX(0)}45%,58%{transform:translateX(31px)}90%,100%{transform:translateX(0)}}
${a('.k1', 'slide', 11, { ease: 'ease-in' })}${a('.k1p', 'puff', 11, { ease: 'linear' })}${a('.k2', 'slide2', 17, { ease: 'ease-in', off: 0.4 })}${a('.k2p', 'puff', 17, { ease: 'linear', off: 0.4 })}
.clump{opacity:0}.puff{opacity:0;transform-box:fill-box;transform-origin:center}
@keyframes slide{0%,84%{opacity:0;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}93%{opacity:1;transform:translateY(150px)}94%,100%{opacity:0;transform:translateY(150px)}}
@keyframes slide2{0%,84%{opacity:0;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}93%{opacity:1;transform:translateY(215px)}94%,100%{opacity:0;transform:translateY(215px)}}
@keyframes puff{0%,92%{opacity:0;transform:scale(.4)}94%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
${shooting.css}`

  const fall = LAYERS.map((layer, i) => {
    const count = Math.round(layer.most * (0.3 + 0.7 * t))
    const tile = (FLAKES[i] ?? []).slice(0, count).join('')

    return `<g class="d${i}"><g class="flakes p${i}" opacity="${layer.opacity}"><g id="fl${i}">${tile}</g><use href="#fl${i}" y="${-H}"/></g></g>`
  })
  const hills = RIDGES.map((ridge, i) => {
    const top = ridge.base - ridge.height * 0.9
    // The far peaks carry snow above the line where it lies all year.
    const peaks = i === 0 ? `<path d="${PATHS[0] ?? ''}" fill="url(#peak)"/>` : ''

    return `<g class="px${i + 1}"><path class="r${i}" d="${PATHS[i] ?? ''}"/>${peaks}</g><rect class="haze" x="0" y="${top}" width="${W}" height="${H - top}" fill="url(#haze)"/>`
  }).join('')
  const spindrift =
    `<ellipse class="wisp1" cx="0" cy="852" rx="380" ry="13" fill="url(#fog)"/>` +
    `<ellipse class="wisp2" cx="0" cy="884" rx="460" ry="16" fill="url(#fog)"/>` +
    `<ellipse class="wisp3" cx="0" cy="826" rx="320" ry="10" fill="url(#fog)"/>`

  return frame(
    live,
    a,
    style,
    DEFS,
    `<g class="stars">${stars(1 - 0.5 * t)}${shooting.markup}</g><ellipse cx="760" cy="650" rx="1000" ry="210" fill="url(#dusk)" opacity=".55"/>` +
      `${orb(1205, 262, 38)}${hills}${fall[0] ?? ''}<path class="back" d="${BACK_PATH}"/>${fall[1] ?? ''}<path d="${FRONT_PATH}" fill="url(#drift)"/>` +
      `${GLINTS}${spindrift}${cabin(t, live.isBusy)}${tree(t, live.isBusy)}${fall[2] ?? ''}${fall[3] ?? ''}`,
  )
}
