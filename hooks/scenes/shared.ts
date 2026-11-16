// What every scene shares: the canvas, seeded randomness, ridges, stars, the
// things that move in more than one scene, and the SVG frame.
//
// A scene is one SVG drawn from the session as it is now (Live). It is drawn
// again whenever the session moves, so every animation starts where the clock
// says it already is: a redraw does not send the snow back to the top.

export const STEPS = 20
export const W = 1600
export const H = 1000

export const random = (seed: number) => {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const n1 = (value: number) => Math.round(value * 10) / 10

// Smooth 1D value noise, summed in octaves.
export const noise = (seed: number) => {
  const next = random(seed)
  const lattice = Array.from({ length: 512 }, () => next())

  const at = (x: number) => {
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    const a = lattice[((i % 512) + 512) % 512] ?? 0
    const b = lattice[(((i + 1) % 512) + 512) % 512] ?? 0

    return a + (b - a) * u
  }

  return (x: number, octaves: number, sharp: number) => {
    let sum = 0
    let amplitude = 1
    let total = 0
    let frequency = 1

    for (let o = 0; o < octaves; o += 1) {
      const v = at(x * frequency + o * 37.1)
      // `sharp` folds the noise into creases, the way far alpine ridges read.
      const folded = 1 - Math.abs(2 * v - 1)
      sum += amplitude * (v * (1 - sharp) + folded * sharp)
      total += amplitude
      amplitude *= 0.5
      frequency *= 2.03
    }

    // Stretch the middle of the range, so crests and saddles both show.
    return (sum / total - 0.32) / 0.42
  }
}

export type Ridge = {
  seed: number
  base: number
  height: number
  scale: number
  octaves: number
  sharp: number
  pines: number
  pineHeight?: number
}

const pine = (x: number, y: number, h: number, w: number) => {
  const tiers = [
    [1, 0],
    [0.5, 0.36],
    [0.74, 0.36],
    [0.3, 0.68],
    [0.5, 0.68],
    [0, 1],
  ] as const
  const left = tiers.map(([dx, dy]) => `${n1(x - w * dx)},${n1(y - h * dy)}`)
  const right = tiers
    .slice(0, -1)
    .reverse()
    .map(([dx, dy]) => `${n1(x + w * dx)},${n1(y - h * dy)}`)

  return `M${n1(x - w)},${n1(y + 6)}L${left.join('L')}L${right.join('L')}L${n1(x + w)},${n1(y + 6)}Z`
}

/** How high a ridge stands at each x. */
export const crestOf = (ridge: Ridge) => {
  const height = noise(ridge.seed)

  return (x: number) => ridge.base - ridge.height * height(x / ridge.scale, ridge.octaves, ridge.sharp)
}

/** A ridge's silhouette as path data, closed along the foot of the canvas. */
export const ridgePath = (ridge: Ridge) => {
  const crest = crestOf(ridge)
  const points: string[] = []

  for (let x = -8; x <= W + 8; x += 8) {
    points.push(`${x},${n1(crest(x))}`)
  }
  let d = `M-8,${H + 8}L${points.join('L')}L${W + 8},${H + 8}Z`
  const next = random(ridge.seed * 7)

  for (let p = 0; p < ridge.pines; p += 1) {
    const x = next() * W
    const h = (ridge.pineHeight ?? 16) * (0.55 + next() * 0.9)
    d += pine(x, crest(x), h, h * (0.2 + next() * 0.06))
  }

  return d
}

/** The session as a scene reads it. */
export type Live = {
  /** How full the context window is, 0 to 1. */
  t: number
  /** The same as a whole percentage, or undefined before the first reading. */
  percent: number | undefined
  /** Whether Claude is working on a turn right now. */
  isBusy: boolean
  /** The clock, in milliseconds: where every animation picks up from. */
  now: number
}

type Motion = { ease?: string; alt?: boolean; off?: number; rev?: boolean }

/** Writes an animation rule that is already `now` into its loop. */
export type Animate = (selector: string, name: string, seconds: number, motion?: Motion) => string

export const animate =
  (now: number): Animate =>
  (selector, name, seconds, motion = {}) => {
    const cycle = seconds * (motion.alt === true ? 2 : 1)
    const at = (now / 1000 + (motion.off ?? 0) * seconds) % cycle

    return `${selector}{animation:${name} ${seconds}s ${motion.ease ?? 'ease-in-out'} -${n1(at)}s infinite${motion.alt === true ? ' alternate' : ''}${motion.rev === true ? ' reverse' : ''}}`
  }

/** A star field: the first stars stay where they are as more come out. */
export const starField = (seed: number, count: number, maxY: number) => {
  const next = random(seed)
  const stars = Array.from({ length: count }, () => {
    const x = n1(next() * W)
    const y = n1(maxY * next() ** 1.5)
    const r = n1(0.7 + next() ** 3 * 1.5)
    const o = n1(0.4 + next() * 0.6)
    const tone = Math.floor(next() * 3)
    const twinkle = next() < 0.45 ? ` t${1 + Math.floor(next() * 4)}` : ''

    return `<circle class="s${tone}${twinkle}" cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`
  })

  return (t: number) => stars.slice(0, Math.round(24 + t * (count - 24))).join('')
}

// Night is the default; day is the same scene under the app's light mode.
export const palette = (dark: string, light: string) =>
  `:root{color-scheme:light dark;--lamp:#f4c37c;--board:#2b231c;--edge:#57463a;--ink:#f0dfba;--rope:#57463a;${dark}}` +
  `@media (prefers-color-scheme:light){:root{--board:#6f5d4b;--edge:#57463a;--ink:#f7eedb;--rope:#6f5d4b;${light}}}`

const commonStyle = (a: Animate) =>
  `.a{stop-color:var(--sky0)}.b{stop-color:var(--sky1)}.c{stop-color:var(--sky2)}.d{stop-color:var(--sky3)}` +
  `.m{stop-color:var(--mist)}.g{stop-color:var(--glow)}.lp{stop-color:var(--lamp)}` +
  `.stars{opacity:var(--star)}.s0{fill:#f1ecde}.s1{fill:#dbe4ea}.s2{fill:#f3deb6}` +
  `.orb{fill:var(--orb)}.mare{fill:#6f7a78;opacity:var(--mare)}` +
  a('.t1', 'tw', 2.7) + a('.t2', 'tw', 3.9, { off: 0.3 }) + a('.t3', 'tw', 5.3, { off: 0.6 }) + a('.t4', 'tw', 7.1, { off: 0.8 }) +
  `@keyframes tw{0%,100%{opacity:1}50%{opacity:.15}}` +
  a('.f1', 'dr', 38, { alt: true }) + a('.f2', 'dr', 51, { alt: true, off: 0.4, rev: true }) + a('.f3', 'dr', 64, { alt: true, off: 0.7 }) +
  `@keyframes dr{from{transform:translateX(-170px)}to{transform:translateX(170px)}}` +
  a('.c1', 'cl', 95, { ease: 'linear' }) + a('.c2', 'cl', 140, { ease: 'linear', off: 0.45 }) + a('.c3', 'cl', 190, { ease: 'linear', off: 0.8 }) +
  `@keyframes cl{from{transform:translateX(-520px)}to{transform:translateX(2120px)}}` +
  a('.px1', 'px1', 31, { alt: true }) + a('.px2', 'px2', 31, { alt: true }) + a('.px3', 'px3', 31, { alt: true }) + a('.px4', 'px4', 31, { alt: true }) +
  `.px1,.px2,.px3,.px4{transform-origin:800px 620px}` +
  `@keyframes px1{from{transform:translateX(-7px) scale(1.05)}to{transform:translateX(7px) scale(1.05)}}` +
  `@keyframes px2{from{transform:translateX(-14px) scale(1.05)}to{transform:translateX(14px) scale(1.05)}}` +
  `@keyframes px3{from{transform:translateX(-24px) scale(1.06)}to{transform:translateX(24px) scale(1.06)}}` +
  `@keyframes px4{from{transform:translateX(-38px) scale(1.08)}to{transform:translateX(38px) scale(1.08)}}` +
  a('.wisp1', 'wisp', 17, { ease: 'linear' }) + a('.wisp2', 'wisp', 23, { ease: 'linear', off: 0.5 }) + a('.wisp3', 'wisp', 29, { ease: 'linear', off: 0.25 }) +
  `@keyframes wisp{from{transform:translateX(-700px)}to{transform:translateX(2300px)}}` +
  a('.swing', 'sg', 4.6, { alt: true }) + `@keyframes sg{from{transform:rotate(-2.4deg)}to{transform:rotate(2.4deg)}}` +
  a('.flick', 'fk', 3.1) + `@keyframes fk{0%,100%{opacity:1}23%{opacity:.82}41%{opacity:.96}62%{opacity:.78}80%{opacity:.93}}` +
  ['sm1', 'sm2', 'sm3', 'sm4'].map((name, i) => a(`.${name}`, 'sm', 7, { ease: 'linear', off: i / 4 })).join('') +
  `.smoke{fill:var(--mist);opacity:0;transform-box:fill-box;transform-origin:center}` +
  `@keyframes sm{0%{opacity:0;transform:translate(0,0) scale(.5)}14%{opacity:.3}100%{opacity:0;transform:translate(54px,-150px) scale(2.8)}}` +
  `.rope{stroke:var(--rope);stroke-width:3;fill:none}.board{fill:var(--board);stroke:var(--edge);stroke-width:3}` +
  `.pct{fill:var(--ink);font:700 44px ui-rounded,system-ui,sans-serif}.cap{fill:var(--ink);opacity:.72;font:600 15px system-ui,sans-serif;letter-spacing:1.5px}` +
  `.hut{fill:var(--hut)}.win{fill:var(--lamp)}.unlit{opacity:.16}` +
  `.meteor{opacity:0}@keyframes me{0%{opacity:0;transform:translate(0,0)}3%{opacity:calc(.9*var(--star))}11%{opacity:0;transform:translate(-300px,160px)}100%{opacity:0;transform:translate(-300px,160px)}}` +
  `@media (max-aspect-ratio:4/5){.sky-body{transform:translateX(-330px)}}` +
  `@media (min-aspect-ratio:17/10){.hud{transform:translateY(70px)}}@media (max-aspect-ratio:13/10){.hud{transform:translateX(130px)}}` +
  `@media (prefers-reduced-motion:reduce){*{animation:none!important}.px1,.px2,.px3,.px4{transform:scale(1.06)}}`

const COMMON_DEFS =
  `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="a"/><stop offset=".24" class="b"/><stop offset=".44" class="c"/><stop offset=".6" class="d"/></linearGradient>` +
  `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="m" stop-opacity="0"/><stop offset=".7" class="m" stop-opacity=".55"/><stop offset="1" class="m" stop-opacity=".8"/></linearGradient>` +
  `<radialGradient id="fog"><stop offset="0" class="m" stop-opacity=".5"/><stop offset=".6" class="m" stop-opacity=".16"/><stop offset="1" class="m" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="glow"><stop offset="0" class="g" stop-opacity=".5"/><stop offset=".14" class="g" stop-opacity=".2"/><stop offset=".45" class="g" stop-opacity=".06"/><stop offset="1" class="g" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="lampglow"><stop offset="0" class="lp" stop-opacity=".55"/><stop offset=".35" class="lp" stop-opacity=".16"/><stop offset="1" class="lp" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="soft"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f1e4"/><stop offset="1" stop-color="#f6f1e4" stop-opacity="0"/></linearGradient>`

/** The moon by night, a pale sun by day: a disc in its glow. */
export const orb = (x: number, y: number, r: number) => {
  const k = r / 27

  return (
    `<g class="sky-body"><circle cx="${x}" cy="${y}" r="${n1(r * 11)}" fill="url(#glow)"/>` +
    `<circle class="orb" cx="${x}" cy="${y}" r="${r}"/>` +
    `<g class="mare"><ellipse cx="${n1(x - 8 * k)}" cy="${n1(y - 7 * k)}" rx="${n1(9 * k)}" ry="${n1(7 * k)}"/>` +
    `<ellipse cx="${n1(x + 7 * k)}" cy="${n1(y + 3 * k)}" rx="${n1(6 * k)}" ry="${n1(8 * k)}"/>` +
    `<ellipse cx="${n1(x - 5 * k)}" cy="${n1(y + 11 * k)}" rx="${n1(7 * k)}" ry="${n1(4 * k)}"/>` +
    `<circle cx="${n1(x + 12 * k)}" cy="${n1(y - 12 * k)}" r="${n1(3 * k)}"/></g></g>`
  )
}

/** A cloud that crosses the sky: `lane` is 1, 2 or 3, each at its own pace. */
export const cloud = (lane: 1 | 2 | 3, y: number, size: number, opacity: number) =>
  `<g class="c${lane}" opacity="${opacity}"><ellipse cx="0" cy="${y}" rx="${n1(300 * size)}" ry="${n1(72 * size)}" fill="url(#fog)"/>` +
  `<ellipse cx="${n1(150 * size)}" cy="${n1(y - 22 * size)}" rx="${n1(190 * size)}" ry="${n1(64 * size)}" fill="url(#fog)"/>` +
  `<ellipse cx="${n1(-170 * size)}" cy="${n1(y + 14 * size)}" rx="${n1(210 * size)}" ry="${n1(56 * size)}" fill="url(#fog)"/></g>`

/** Shooting stars: a few while Claude is idle, more while it works. */
export const meteors = (a: Animate, isBusy: boolean) => {
  const all = [
    { x: 560, y: 130, seconds: 13, off: 0.1 },
    { x: 980, y: 80, seconds: 9, off: 0.55 },
    { x: 340, y: 240, seconds: 7, off: 0.8 },
  ]
  const shown = isBusy ? all : all.slice(0, 1)

  return {
    css: shown.map((m, i) => a(`.me${i}`, 'me', m.seconds, { ease: 'linear', off: m.off })).join(''),
    markup: shown
      .map(
        (m, i) =>
          `<g class="meteor me${i}"><rect x="${m.x}" y="${m.y}" width="150" height="1.8" rx=".9" fill="url(#trail)" transform="rotate(-28 ${m.x} ${m.y})"/></g>`,
      )
      .join(''),
  }
}

/** A hut whose window is lit, and whose chimney smokes, while Claude works. */
export const hut = (x: number, y: number, size: number, isBusy: boolean) =>
  `<g transform="translate(${n1(x)} ${n1(y)}) scale(${size})">` +
  (isBusy ? `<circle class="flick" cx="0" cy="-22" r="120" fill="url(#lampglow)"/>` : '') +
  (isBusy
    ? `<circle class="smoke sm1" cx="19" cy="-80" r="6"/><circle class="smoke sm2" cx="19" cy="-80" r="6"/><circle class="smoke sm3" cx="19" cy="-80" r="6"/><circle class="smoke sm4" cx="19" cy="-80" r="6"/>`
    : '') +
  `<rect class="hut" x="14" y="-76" width="10" height="26"/>` +
  `<path class="hut" d="M-34,6V-28L0,-60L34,-28V6ZM-46,-24L0,-68L46,-24L40,-19L0,-57L-40,-19Z"/>` +
  `<g class="${isBusy ? 'flick' : 'unlit'}"><rect class="win" x="-13" y="-30" width="26" height="22" rx="2"/></g>` +
  `<path class="hut" d="M-1,-30h2v22h-2zM-13,-20h26v2h-26z"/></g>`

// The sign that hangs in the corner of every scene: how full the context is.
const sign = (percent: number | undefined) =>
  `<g class="hud"><g class="swing" style="transform-origin:210px -40px">` +
  `<path class="rope" d="M176,-40V150M244,-40V150"/>` +
  `<rect class="board" x="142" y="146" width="136" height="92" rx="10"/>` +
  `<text class="pct" x="210" y="198" text-anchor="middle">${percent === undefined ? '–' : `${Math.round(percent)}%`}</text>` +
  `<text class="cap" x="210" y="223" text-anchor="middle">CONTEXT</text></g></g>`

export const frame = (live: Live, a: Animate, style: string, defs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
  `<style>${style.replace(/\n/g, '')}${commonStyle(a)}</style><defs>${COMMON_DEFS}${defs}</defs>` +
  `<rect width="${W}" height="${H}" fill="url(#sky)"/>${body}${sign(live.percent)}</svg>`
