// Sea. As the context window fills, the moon rises from the horizon and its
// path of light runs further across the water; more stars come out. Far swell
// lines run in, three heavy swells roll across the foreground at their own
// speeds, spray bursts on the rocks, a dolphin leaps now and then, a boat
// crosses the horizon and gulls wheel by day.
//
// While Claude works the lighthouse sweeps its beam, the boat carries a lamp
// and the swell runs higher and faster.

import { animate, cloud, crestOf, frame, H, meteors, n1, orb, palette, random, ridgePath, starField, W } from './shared'
import type { Live, Ridge } from './shared'

const HORIZON = 560
const HEAD: Ridge = { seed: 91, base: HORIZON + 4, height: 46, scale: 520, octaves: 4, sharp: 0.3, pines: 0 }
const HEADLAND = ridgePath(HEAD)
const ROCKS = ridgePath({ seed: 131, base: 960, height: 85, scale: 260, octaves: 4, sharp: 0.55, pines: 0 })
const LIGHT_X = 1250
const LIGHT_Y = crestOf(HEAD)(LIGHT_X) + 3
const stars = starField(4201, 190, HORIZON - 20)

// Swell lines, closer together toward the horizon. Each drifts by exactly its
// own wavelength, so the loop has no seam.
const WAVES = Array.from({ length: 18 }, (_, i) => {
  const depth = (i + 1) / 18
  const y = HORIZON + 8 + 215 * depth ** 1.7
  const length = 70 + 300 * depth
  const rise = 1 + 5 * depth
  let d = `M${-2 * length},${n1(y)}`

  for (let x = -2 * length; x < W + 2 * length; x += length) {
    d += `q${n1(length / 4)},${n1(-rise)} ${n1(length / 2)},0t${n1(length / 2)},0`
  }

  return {
    length,
    seconds: Math.round(9 + 12 * depth + (i % 3) * 3),
    markup: `<path class="wave v${i}" d="${d}" stroke-width="${n1(0.8 + 2 * depth)}" stroke-dasharray="${n1(length * 0.31)} ${n1(length * 0.17)} ${n1(length * 0.12)} ${n1(length * 0.4)}" stroke-dashoffset="${n1(length * ((i * 0.37) % 1))}" stroke-opacity="${n1(0.4 + 0.6 * depth)}"/>`,
  }
})

// The near swells: a filled wave one wavelength long, repeated, that travels
// by exactly that wavelength.
const SWELLS = [
  { y: 792, length: 460, rise: 15, seconds: 13 },
  { y: 842, length: 600, rise: 21, seconds: 10 },
  { y: 896, length: 760, rise: 28, seconds: 8 },
].map((s, i) => {
  let d = `M${-2 * s.length},${s.y}`

  for (let x = -2 * s.length; x < W + s.length; x += s.length) {
    d += `q${s.length / 4},${-s.rise} ${s.length / 2},0t${s.length / 2},0`
  }

  return { ...s, markup: `<g class="heave h${i}"><g class="sv${i}"><path class="sw${i}" d="${d}V${H + 40}H${-2 * s.length}Z"/><path class="foam" d="${d}" stroke-width="${2 + i}"/></g></g>` }
})

const DOLPHIN = `<path d="M-34,0C-20,-16 12,-18 34,-4L44,-10L42,2L46,10L34,4C14,8 -14,8 -34,0ZM-4,-13L6,-26L10,-12Z"/>`

const GULLS = (() => {
  const next = random(47)

  return Array.from({ length: 5 }, (_, i) => `<g transform="translate(${n1(i * 46 + next() * 14)} ${n1(next() * 60)})"><path class="wing fb${i % 3}" d="M-11,0q5.5,-8 11,0q5.5,-8 11,0"/></g>`).join('')
})()

const spray = (x: number, y: number, name: string) =>
  `<g class="${name}">${[-26, -10, 6, 22, -2].map((dx, i) => `<circle class="foamfill" cx="${x + dx}" cy="${y - (i % 3) * 12}" r="${7 + (i % 3) * 3}"/>`).join('')}</g>`

const DEFS =
  `<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="e0"/><stop offset=".55" class="e1"/></linearGradient>` +
  `<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="lp" stop-opacity=".7"/><stop offset="1" class="lp" stop-opacity="0"/></linearGradient>`

export const sea = (live: Live) => {
  const a = animate(live.now)
  const { t } = live
  const shooting = meteors(a, live.isBusy)
  const style = `${palette(
    '--sky0:#070c24;--sky1:#101b44;--sky2:#22386c;--sky3:#56608f;--sea0:#35548a;--sea1:#0a1630;--sw0:#1c3564;--sw1:#132750;--sw2:#0b1a3a;--foam:#cfe2ff;--fo:.5;--land:#131d3a;--rock:#060b1c;--hut:#080e22;--mist:#a9b9e0;--wave:#bcd0f2;--wo:.26;--day:0;--orb:#ece5cd;--glow:#cfd6e0;--star:1;--mare:.07;--glint:.6',
    '--sky0:#6fb0e0;--sky1:#a3cfea;--sky2:#d3e6ee;--sky3:#fbe6cf;--sea0:#7fc6dc;--sea1:#2f86b4;--sw0:#3d9ac0;--sw1:#2b82ac;--sw2:#1c6a96;--foam:#ffffff;--fo:.9;--land:#6f9ab8;--rock:#2f5878;--hut:#28506c;--mist:#f4f6f0;--wave:#ffffff;--wo:.65;--day:1;--orb:#f6edd4;--glow:#efd9a8;--star:0;--mare:0;--glint:.6',
  )}
.e0{stop-color:var(--sea0)}.e1{stop-color:var(--sea1)}
.land{fill:var(--land)}.rock{fill:var(--rock)}
.wave{fill:none;stroke:var(--wave);opacity:var(--wo)}
.sw0{fill:var(--sw0)}.sw1{fill:var(--sw1)}.sw2{fill:var(--sw2)}.foam{fill:none;stroke:var(--foam);opacity:var(--fo);stroke-linecap:round}.foamfill{fill:var(--foam)}
${SWELLS.map((s, i) => `${a(`.sv${i}`, `sv${i}`, live.isBusy ? s.seconds * 0.65 : s.seconds, { ease: 'linear', rev: i === 1 })}@keyframes sv${i}{to{transform:translateX(${s.length}px)}}${a(`.h${i}`, 'heave', 3.6 + i * 0.7, { alt: true, off: i * 0.3 })}`).join('')}
@keyframes heave{from{transform:translateY(${live.isBusy ? -11 : -6}px)}to{transform:translateY(${live.isBusy ? 11 : 6}px)}}
.leap{fill:var(--rock);opacity:0;transform-origin:250px 850px}${a('.leap', 'leap', 19, { ease: 'linear' })}
@keyframes leap{0%,78%{opacity:0;transform:rotate(-62deg)}79%{opacity:1;transform:rotate(-62deg)}89%{opacity:1;transform:rotate(62deg)}90%,100%{opacity:0;transform:rotate(62deg)}}
.sp1,.sp2{opacity:0;transform-box:fill-box;transform-origin:50% 100%}${a('.sp1', 'spray', 5.5, { ease: 'ease-out' })}${a('.sp2', 'spray', 7.5, { ease: 'ease-out', off: 0.4 })}
@keyframes spray{0%,55%{opacity:0;transform:scale(.3)}62%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.7) translateY(-26px)}}
.gulls{opacity:var(--day)}.wing{fill:none;stroke:var(--rock);stroke-width:2.6;stroke-linecap:round;transform-box:fill-box;transform-origin:center}
${a('.gulls', 'glide', 52, { ease: 'linear' })}@keyframes glide{from{transform:translate(1750px,40px)}to{transform:translate(-300px,-60px)}}
${a('.fb0', 'flap', 0.7, { alt: true })}${a('.fb1', 'flap', 0.8, { alt: true, off: 0.3 })}${a('.fb2', 'flap', 0.62, { alt: true, off: 0.6 })}@keyframes flap{from{transform:scaleY(1)}to{transform:scaleY(-.45)}}
.glint{fill:var(--orb);opacity:var(--glint)}
${WAVES.map((w, i) => `${a(`.v${i}`, `w${i}`, w.seconds, { ease: 'linear', rev: i % 2 === 1 })}@keyframes w${i}{to{transform:translateX(${n1(w.length)}px)}}`).join('')}
${a('.sail', 'sa', 170, { ease: 'linear' })}@keyframes sa{from{transform:translateX(-80px)}to{transform:translateX(1700px)}}
${a('.bob', 'bo', 3.4, { alt: true })}@keyframes bo{from{transform:translateY(-1.5px) rotate(-2.5deg)}to{transform:translateY(1.5px) rotate(2.5deg)}}
.bob{transform-origin:0px ${HORIZON + 16}px}
${a('.beam', 'bm', 6)}@keyframes bm{0%,100%{transform:scaleX(1);opacity:.9}25%{opacity:.25}50%{transform:scaleX(-1);opacity:.9}75%{opacity:.25}}
.beam{transform-origin:${LIGHT_X}px ${n1(LIGHT_Y - 70)}px}
${a('.blink', 'bk', 4)}@keyframes bk{0%,100%{opacity:.25}50%{opacity:1}}
${shooting.css}`

  const ox = n1(1150 - 90 * t)
  const oy = n1(HORIZON - 30 - 330 * t ** 0.85)
  // The path of light: short dashes that widen and scatter toward the viewer.
  const next = random(977)
  const reach = 90 + 130 * t
  let glints = ''

  for (let i = 0; i < 90; i += 1) {
    const depth = next() ** 1.4
    const y = HORIZON + 6 + reach * depth
    const spread = 16 + 170 * depth * (0.5 + t)
    const x = ox + (next() - 0.5) * spread
    const w = 6 + 40 * depth * next()

    glints += `<rect class="glint t${1 + (i % 4)}" x="${n1(x - w / 2)}" y="${n1(y)}" width="${n1(w)}" height="${n1(1.2 + 2.2 * depth)}" rx="1" fill-opacity="${n1(0.3 + 0.6 * (1 - depth) * next())}"/>`
  }

  const ly = n1(LIGHT_Y)
  const top = n1(LIGHT_Y - 70)
  const beam = live.isBusy
    ? `<g class="beam"><path d="M${LIGHT_X},${top}l620,-64v128Z" fill="url(#beam)"/></g><circle class="flick" cx="${LIGHT_X}" cy="${top}" r="70" fill="url(#lampglow)"/>`
    : ''
  const lighthouse =
    `${beam}<path class="hut" d="M${LIGHT_X - 9},${ly}L${LIGHT_X - 6},${n1(LIGHT_Y - 62)}h12L${LIGHT_X + 9},${ly}ZM${LIGHT_X - 9},${n1(LIGHT_Y - 64)}h18v3h-18ZM${LIGHT_X - 7},${n1(LIGHT_Y - 78)}h14l-7,-9Z"/>` +
    `<rect class="win ${live.isBusy ? 'flick' : 'blink'}" x="${LIGHT_X - 5}" y="${n1(LIGHT_Y - 77)}" width="10" height="13"/>`
  const lamp = live.isBusy
    ? `<circle class="flick" cx="-24" cy="${HORIZON + 6}" r="26" fill="url(#lampglow)"/><circle class="win flick" cx="-24" cy="${HORIZON + 6}" r="2.6"/><rect class="win flick" x="-26" y="${HORIZON + 24}" width="4" height="26" rx="2" opacity=".5"/>`
    : ''
  const boat = `<g class="sail"><g class="bob"><path class="hut" d="M-22,${HORIZON + 14}h44l-7,8h-30ZM-2,${HORIZON + 12}V${HORIZON - 26}L20,${HORIZON + 10}ZM-5,${HORIZON + 10}V${HORIZON - 16}L-19,${HORIZON + 10}Z"/>${lamp}</g></g>`
  const dolphin = `<g class="leap"><g transform="translate(250 742)">${DOLPHIN}</g></g>`

  return frame(
    live,
    a,
    style,
    DEFS,
    `<g class="stars">${stars(t)}${shooting.markup}</g>${orb(ox, oy, 30)}` +
      `${cloud(1, 300, 1, 0.5)}${cloud(2, 190, 0.8, 0.4)}${cloud(3, 410, 1.1, 0.45)}` +
      `<path class="land" d="${HEADLAND}"/>${lighthouse}` +
      `<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#sea)"/>` +
      `<g class="sky-body">${glints}</g>${WAVES.map(w => w.markup).join('')}${boat}` +
      `<ellipse class="f1" cx="500" cy="${HORIZON + 6}" rx="700" ry="34" fill="url(#fog)"/>` +
      `<ellipse class="f2" cx="1250" cy="${HORIZON + 10}" rx="620" ry="30" fill="url(#fog)"/>` +
      `<g class="gulls"><g transform="translate(0 300)">${GULLS}</g></g>` +
      `${SWELLS[0]?.markup ?? ''}${dolphin}${SWELLS[1]?.markup ?? ''}${spray(1230, 905, 'sp1')}${spray(215, 912, 'sp2')}${SWELLS[2]?.markup ?? ''}` +
      `<path class="rock" d="${ROCKS}"/>`,
  )
}
