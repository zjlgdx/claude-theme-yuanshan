// The four looks: each is a scene and the palette that goes with it. Surfaces
// are tinted toward the scene, never pure black or white, and text is a warm
// off-white or soft ink, so long sessions stay easy on the eyes.

import type { ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { bamboo } from './scenes/bamboo'
import { mountains } from './scenes/mountains'
import { rain } from './scenes/rain'
import { sea } from './scenes/sea'
import type { Live } from './scenes/shared'
import { snow } from './scenes/snow'

export type SceneName = 'mountains' | 'sea' | 'rain' | 'bamboo' | 'snow'

type Tones = readonly [page: string, card: string, panel: string, menu?: string]

type Definition = {
  label: string
  title: string
  alt: string
  // What a person may type for it after the command.
  names: readonly string[]
  draw: (live: Live) => string
  accent: string
  success: string
  light: Tones
  dark: Tones
}

const DEFINITIONS: Record<SceneName, Definition> = {
  mountains: {
    label: 'Far Mountains',
    title: '遠山 mountains',
    alt: 'Mountain ridges under an aurora, with a moon that climbs as the context window fills',
    names: ['mountains', 'mountain', '山', '遠山', '远山'],
    draw: mountains,
    accent: '#4f8f8a',
    success: '#6b8f4e',
    light: ['#dfd8c8', '#e5dfd0', '#ebe6d8'],
    dark: ['#14191c', '#1a2024', '#20272c', '#252d33'],
  },
  sea: {
    label: 'Night Sea',
    title: '海 sea',
    alt: 'A calm sea where the moon rises and its path of light lengthens as the context window fills',
    names: ['sea', 'ocean', '海'],
    draw: sea,
    accent: '#4a7fa5',
    success: '#6b8f4e',
    light: ['#d9dad2', '#e0e1d9', '#e7e8e1'],
    dark: ['#12181f', '#171f27', '#1d2630', '#222c37'],
  },
  rain: {
    label: 'Rain',
    title: '雨 rain',
    alt: 'Wooded hills in rain that thickens as the context window fills',
    names: ['rain', '雨'],
    draw: rain,
    accent: '#5f8f9a',
    success: '#6b8f4e',
    light: ['#d6d7d0', '#ddded7', '#e5e5df'],
    dark: ['#15191a', '#1b2021', '#212728', '#262d2e'],
  },
  snow: {
    label: 'Snowfall',
    title: '雪 snow',
    alt: 'A snowy valley where the snow falls harder and lies deeper as the context window fills',
    names: ['snow', '雪'],
    draw: snow,
    accent: '#6f86c9',
    success: '#6b8f4e',
    light: ['#d8dbd8', '#dfe2df', '#e7e9e6'],
    dark: ['#131829', '#191f33', '#1f263d', '#252c45'],
  },
  bamboo: {
    label: 'Bamboo Grove',
    title: '竹林 bamboo',
    alt: 'A bamboo grove in mist where fireflies come out as the context window fills',
    names: ['bamboo', '竹', '竹林'],
    draw: bamboo,
    accent: '#4d8f6b',
    success: '#86933c',
    light: ['#d9dac6', '#e0e1ce', '#e7e8d7'],
    dark: ['#141a16', '#1a211c', '#202822', '#252e28'],
  },
}

export const SCENES = Object.keys(DEFINITIONS) as SceneName[]

export const titleOf = (name: SceneName) => DEFINITIONS[name].title
export const altOf = (name: SceneName) => DEFINITIONS[name].alt
export const drawScene = (name: SceneName, live: Live) => DEFINITIONS[name].draw(live)

export const isScene = (value: unknown): value is SceneName =>
  typeof value === 'string' && (SCENES as string[]).includes(value)

/** The scene a person named, in English or Chinese; undefined for none of them. */
export const sceneNamed = (word: string) => SCENES.find(name => DEFINITIONS[name].names.includes(word))

const built = new Map<SceneName, { look: ThemeSetArgs; problems: string[] }>()

/** The whole look for a scene: its palette, and the scene under frosted panels. */
export const lookOf = (name: SceneName) => {
  const kept = built.get(name)

  if (kept !== undefined) {
    return kept
  }
  const d = DEFINITIONS[name]
  const { theme, problems } = makeColors({
    label: d.label,
    roles: { accent: d.accent, danger: '#b8503f', success: d.success, warning: '#b5842c', pro: '#8a6fa8' },
    light: {
      gray: {
        anchors: {
          'surface-0': d.light[0],
          'surface-1': d.light[1],
          'surface-2': d.light[2],
          'text-primary': '#2b2a26',
          'text-secondary': '#4f4c44',
          'text-muted': '#5e5a51',
        },
      },
    },
    dark: {
      gray: {
        anchors: {
          'surface-0': d.dark[0],
          'surface-1': d.dark[1],
          'surface-2': d.dark[2],
          'surface-3': d.dark[3] ?? d.dark[2],
          'text-primary': '#e4ddce',
          'text-secondary': '#bfb9ab',
          'text-muted': '#9a968b',
        },
      },
    },
  })
  // The panels over the scene: clear enough to see it move, tinted enough to read on.
  const look: ThemeSetArgs = {
    colors: theme,
    backdrop: { scene: name, glass: { blur: 10, opacity: 0.5 } },
  }
  const made = { look, problems }
  built.set(name, made)

  return made
}
