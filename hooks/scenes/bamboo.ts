// Bamboo grove. Canes sway in three depths, each depth drifting against the
// next, and moonlight falls through them in slow shafts. Leaves let go and
// tumble down, mist runs along the mossy ground and grass stirs at its edge.
// As the context window fills, fireflies come out and the moon climbs.
//
// While Claude works the stone lantern is lit, moths circle it, the wind
// picks up and more leaves fall.

import { animate, frame, H, n1, orb, palette, random, ridgePath, W } from './shared'
import type { Live, Ridge } from './shared'

type Depth = {
  seed: number
  stalks: number
  width: number
  leaves: number
  leaf: number
  // Where stalks may stand: far ones anywhere, near ones only at the edges, so
  // the middle, where the words are, stays open.
  edge: number
}

const DEPTHS: readonly Depth[] = [
  { seed: 301, stalks: 30, width: 5, leaves: 12, leaf: 30, edge: 0 },
  { seed: 311, stalks: 14, width: 10, leaves: 16, leaf: 46, edge: 0.18 },
  { seed: 331, stalks: 7, width: 19, leaves: 20, leaf: 70, edge: 0.3 },
]

const leaf = (x: number, y: number, length: number, angle: number) => {
  const width = length * 0.11

  return `<path transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(angle)})" d="M0,0Q${n1(length * 0.4)},${n1(-width)} ${n1(length)},0Q${n1(length * 0.4)},${n1(width)} 0,0Z"/>`
}

const grove = (depth: Depth, index: number) => {
  const next = random(depth.seed)
  let markup = ''

  for (let s = 0; s < depth.stalks; s += 1) {
    // Keep the near stalks to the two sides.
    const side = next()
    const span = (1 - depth.edge) / 2
    const u = depth.edge === 0 ? next() : side < 0.5 ? next() * span * 0.7 : 1 - next() * span * 0.7
    const foot = u * W
    const lean = (next() - 0.5) * 90
    const top = -40 - next() * 120
    const width = depth.width * (0.75 + next() * 0.5)
    const at = (y: number) => foot + (lean * (H - y)) / H
    let nodes = ''
    let leaves = ''

    for (let y = H - 40 - next() * 60; y > top; y -= 70 + next() * 60 + depth.width * 3) {
      nodes += `M${n1(at(y) - width / 2 - 1)},${n1(y)}h${n1(width + 2)}`

      // Leaves hang from the upper nodes, in small drooping sprays.
      if (y < H * 0.62 && next() < 0.75) {
        const out = next() < 0.5 ? -1 : 1
        const sprays = Math.round((depth.leaves / 6) * (0.5 + next()))

        for (let l = 0; l < sprays; l += 1) {
          const angle = out > 0 ? 20 + next() * 55 : 160 - next() * 55
          const twig = 12 + next() * depth.leaf * 0.9

          leaves += leaf(at(y) + out * twig * 0.6, y - 4 + next() * 22, depth.leaf * (0.6 + next() * 0.6), angle)
        }
      }
    }
    const sway = 1 + (s % 4)

    markup +=
      `<g class="w${sway}" style="transform-origin:${n1(foot)}px ${H}px">` +
      `<path class="cane" stroke-width="${n1(width)}" d="M${n1(foot)},${H + 10}L${n1(at(top))},${n1(top)}"/>` +
      (width > 7 ? `<path class="shine" stroke-width="${n1(width * 0.22)}" d="M${n1(foot + width * 0.18)},${H + 10}L${n1(at(top) + width * 0.18)},${n1(top)}"/>` : '') +
      `<path class="node" stroke-width="${n1(Math.max(1, width * 0.16))}" d="${nodes}"/>${leaves}</g>`
  }

  return `<g class="b${index}">${markup}</g>`
}

const GROVES = DEPTHS.map(grove)

const FLIES = (() => {
  const next = random(733)

  return Array.from({ length: 44 }, (_, i) => {
    const x = n1(80 + next() * (W - 160))
    const y = n1(330 + next() * 560)
    const r = n1(2 + next() * 2)

    return `<g class="fly y${1 + (i % 5)}"><circle cx="${x}" cy="${y}" r="${n1(r * 6)}" fill="url(#spark)"/><circle class="core" cx="${x}" cy="${y}" r="${r}"/></g>`
  })
})()

// Leaves that let go: each falls the height of the grove, turning as it goes.
const FALLING = (() => {
  const next = random(859)

  return Array.from({ length: 26 }, (_, i) => ({
    seconds: Math.round(9 + next() * 9),
    off: next(),
    markup: `<g class="lf lf${i}"><path class="spin" transform="translate(${n1(next() * W)} -40)" d="M0,0Q14,-5 34,0Q14,5 0,0Z"/></g>`,
  }))
})()

const GROUND: Ridge = { seed: 607, base: 960, height: 62, scale: 640, octaves: 2, sharp: 0, pines: 0 }
const GROUND_PATH = ridgePath(GROUND)

// Grass along the ground, in tufts that stir.
const GRASS = (() => {
  const next = random(641)

  return Array.from({ length: 46 }, (_, i) => {
    const x = Math.round(next() * W)
    const y = Math.round(905 + next() * 22)
    const blades = [-16, -6, 5, 15].map(lean => `M0,0q${lean * 0.3},${-14 - next() * 12} ${lean},${-26 - next() * 22}`).join('')

    return `<g transform="translate(${x} ${y})"><path class="blade g${1 + (i % 3)}" d="${blades}"/></g>`
  }).join('')
})()

// Shafts of moonlight slanting down through the canes.
const SHAFTS = [0, 1, 2, 3, 4, 5]
  .map(i => {
    const x = 180 + i * 250
    const w = 60 + (i % 3) * 40

    return `<path class="shaft sh${1 + (i % 3)}" d="M${x + 330},-20h${w}L${x + w * 2.4 - 160},960h${-w * 2.4}Z"/>`
  })
  .join('')

const moths = (x: number, y: number) =>
  [0, 1, 2].map(i => `<g class="moth mo${i}" style="transform-origin:${x}px ${y}px"><circle class="core" cx="${x + 30 + i * 16}" cy="${y}" r="${n1(2.4 - i * 0.4)}"/></g>`).join('')

// A stone lantern at the foot of the grove.
const lantern = (x: number, y: number, isBusy: boolean) =>
  `<g transform="translate(${x} ${y})">` +
  (isBusy ? `<circle class="flick" cx="0" cy="-74" r="150" fill="url(#lampglow)"/>` : '') +
  `<path class="hut" d="M-30,0h60l-8,-12h-44ZM-9,-12h18v-40h-18ZM-24,-52h48v-6h-48ZM-18,-58h36v-34h-36ZM-40,-92h80l-22,-22h-36ZM-7,-114h14l-7,-14Z"/>` +
  `<g class="${isBusy ? 'flick' : 'unlit'}"><rect class="win" x="-11" y="-86" width="22" height="22" rx="2"/></g></g>`

const DEFS =
  `<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="g" stop-opacity=".5"/><stop offset="1" class="g" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="spark"><stop offset="0" class="q" stop-opacity=".5"/><stop offset="1" class="q" stop-opacity="0"/></radialGradient>`

export const bamboo = (live: Live) => {
  const a = animate(live.now)
  const { t } = live
  const sway = live.isBusy ? 2.1 : 1.2
  const falling = FALLING.slice(0, live.isBusy ? 26 : 12)
  const style = `${palette(
    '--sky0:#051410;--sky1:#0b241b;--sky2:#15402f;--sky3:#2d6a50;--b0:#2c5a45;--b1:#17382a;--b2:#071710;--n0:#3f7a5d;--n1:#28543f;--n2:#143024;--shine:#5fae8a;--so:.16;--ground:#061209;--blade:#1d4a34;--hut:#050d09;--mist:#a5d6bd;--haze:.24;--ray:.2;--orb:#ece5cd;--glow:#cfdcc6;--star:1;--mare:.07;--fly:#e6ec86;--leaf:#3d6b4d',
    '--sky0:#a5d39a;--sky1:#c0e0ac;--sky2:#dcecc4;--sky3:#f6f0cf;--b0:#92c486;--b1:#5fa462;--b2:#2f7a44;--n0:#b4dba4;--n1:#84c084;--n2:#4f9a5e;--shine:#e6f7c8;--so:.3;--ground:#2c6a3e;--blade:#3f8a4c;--hut:#2a5438;--mist:#f6f8e4;--haze:.5;--ray:.5;--orb:#f6edd4;--glow:#ebdfa8;--star:0;--mare:0;--fly:#e6ec86;--leaf:#5f9a58',
  )}
.b0{fill:var(--b0);stroke:var(--b0)}.b1{fill:var(--b1);stroke:var(--b1)}.b2{fill:var(--b2);stroke:var(--b2)}
.cane{fill:none;stroke-linecap:butt}.node{fill:none}
.b0 .node{stroke:var(--n0)}.b1 .node{stroke:var(--n1)}.b2 .node{stroke:var(--n2)}
.haze{opacity:var(--haze)}
.shine{fill:none;stroke:var(--shine);opacity:var(--so)}.ground{fill:var(--ground)}
.blade{fill:none;stroke:var(--blade);stroke-width:2.4;stroke-linecap:round}
${a('.g1', 'gr', 2.6, { alt: true })}${a('.g2', 'gr', 3.3, { alt: true, off: 0.4 })}${a('.g3', 'gr', 2.1, { alt: true, off: 0.7 })}@keyframes gr{from{transform:skewX(-${sway * 6}deg)}to{transform:skewX(${sway * 6}deg)}}
.shaft{fill:url(#shaft);opacity:0}${a('.sh1', 'shaft', 9, { alt: true })}${a('.sh2', 'shaft', 13, { alt: true, off: 0.4 })}${a('.sh3', 'shaft', 11, { alt: true, off: 0.7 })}
@keyframes shaft{from{opacity:calc(var(--ray)*.25);transform:translateX(-30px)}to{opacity:var(--ray);transform:translateX(30px)}}
${a('.mo0', 'orbit', 2.3, { ease: 'linear' })}${a('.mo1', 'orbit', 3.4, { ease: 'linear', rev: true })}${a('.mo2', 'orbit', 4.9, { ease: 'linear', off: 0.5 })}
@keyframes orbit{0%{transform:rotate(0) scaleY(.5)}100%{transform:rotate(360deg) scaleY(.5)}}
${a('.w1', 'sw', 4.6, { alt: true })}${a('.w2', 'sw', 5.8, { alt: true, off: 0.3, rev: true })}${a('.w3', 'sw', 6.9, { alt: true, off: 0.6 })}${a('.w4', 'sw', 4.1, { alt: true, off: 0.8, rev: true })}
@keyframes sw{from{transform:rotate(-${sway}deg)}to{transform:rotate(${sway}deg)}}
.fly{opacity:0}.core{fill:var(--fly)}.q{stop-color:var(--fly)}
${a('.y1', 'fl', 5)}${a('.y2', 'fl', 6.5, { off: 0.3 })}${a('.y3', 'fl', 8, { off: 0.5 })}${a('.y4', 'fl', 5.7, { off: 0.7 })}${a('.y5', 'fl', 9.3, { off: 0.1 })}
@keyframes fl{0%,100%{opacity:0;transform:translate(0,0)}30%{opacity:calc(.95*var(--star));transform:translate(28px,-22px)}55%{opacity:calc(.2*var(--star));transform:translate(60px,4px)}78%{opacity:calc(.9*var(--star));transform:translate(22px,26px)}}
.lf{fill:var(--leaf)}
${falling.map((leaf, i) => a(`.lf${i}`, 'lv', leaf.seconds, { ease: 'linear', off: leaf.off })).join('')}
@keyframes lv{0%{transform:translate(0,0)}25%{transform:translate(90px,270px)}50%{transform:translate(20px,540px)}75%{transform:translate(120px,810px)}100%{transform:translate(60px,1090px)}}
.spin{transform-box:fill-box;transform-origin:center}${a('.spin', 'sp', 3.3, { ease: 'linear' })}
@keyframes sp{to{rotate:360deg}}`

  const flies = FLIES.slice(0, Math.round(4 + t * (FLIES.length - 4))).join('')
  const veil = (y: number) => `<rect class="haze" y="${y}" width="${W}" height="${H - y}" fill="url(#haze)"/>`

  return frame(
    live,
    a,
    style,
    DEFS,
    `${orb(n1(1120 - 70 * t), n1(470 - 300 * t ** 0.85), 50)}` +
      `<g class="px1">${GROVES[0] ?? ''}</g>${veil(250)}${SHAFTS}<ellipse class="f1" cx="500" cy="760" rx="800" ry="110" fill="url(#fog)"/>` +
      `<g class="px2">${GROVES[1] ?? ''}</g>${veil(520)}<ellipse class="f2" cx="1150" cy="880" rx="800" ry="100" fill="url(#fog)"/>` +
      `<path class="ground" d="${GROUND_PATH}"/>${GRASS}` +
      `<ellipse class="wisp1" cx="0" cy="900" rx="520" ry="30" fill="url(#fog)"/><ellipse class="wisp3" cx="0" cy="860" rx="420" ry="24" fill="url(#fog)"/>` +
      `${lantern(1245, 905, live.isBusy)}${live.isBusy ? moths(1245, 830) : ''}<g>${flies}</g>${falling.map(leaf => leaf.markup).join('')}<g class="px3">${GROVES[2] ?? ''}</g>`,
  )
}
