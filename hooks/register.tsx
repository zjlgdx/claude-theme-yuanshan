import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage } from 'claude-code'

import { altOf, drawScene, isScene, lookOf, sceneNamed, SCENES, titleOf } from './looks'
import type { SceneName } from './looks'

const PLUGIN = 'yuanshan'
const COMMAND = 'yuanshan'
const OFF = ['off', '關', '关', '關閉', '关闭']
const ON = ['on', '開', '开', '開啟', '开启']

// What the scene reads of the session. A write redraws the scene.
const percent = atom({ plugin: 'yuanshan', key: 'percent' } as const, -1)
const busy = atom({ plugin: 'yuanshan', key: 'busy' } as const, false)

// The window the app's own Context figure is measured against: the one a
// compaction happens in, which a setting can make smaller than the model's.
let room: number | undefined

// The context window's fill as a whole percentage; -1 before the first reading.
const follow = async ($: EngineInterface, context: SessionContextUsage) => {
  if (room === undefined) {
    room = (await $.session.usage({ breakdown: 'summary' })).context.breakdown?.rawMaxTokens
  }
  const share =
    context.tokens !== undefined && room !== undefined && room > 0 ? (context.tokens / room) * 100 : context.percent
  const now = share === undefined ? -1 : Math.min(100, Math.round(share))

  if ((await read($, percent)) !== now) {
    await update($, percent, () => now)
  }
}

const working = async ($: EngineInterface, isBusy: boolean) => {
  if ((await read($, busy)) !== isBusy) {
    await update($, busy, () => isBusy)
  }
}

// The choice is kept between sessions: which scene, and whether the look is on.
const chosen = async ($: EngineInterface): Promise<SceneName> => {
  const kept = await $.store.get('scene')

  return isScene(kept) ? kept : 'mountains'
}

const show = async ($: EngineInterface, name: SceneName) => {
  const { look, problems } = lookOf(name)
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
  }

  return $.theme.set(look)
}

const menu = (current: SceneName, isOff: boolean) =>
  [
    `Scene: ${titleOf(current)}${isOff ? ' (off)' : ''}`,
    ...SCENES.map(name => `  /${COMMAND} ${name}  ${titleOf(name)}`),
    `  /${COMMAND} off  the app's own look`,
    `  /${COMMAND} on  back to the scene`,
  ].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Switch the scene behind the conversation: mountains, sea, rain, bamboo, snow, off',
      argumentHint: 'mountains | sea | rain | bamboo | snow | off | on',
    })
    await follow($, (await $.session.usage()).context)

    if ((await $.store.get('off')) !== true) {
      await show($, await chosen($))
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    const current = await chosen($)
    const isOff = (await $.store.get('off')) === true

    if (word === '') {
      return { text: menu(current, isOff) }
    }

    if (OFF.includes(word)) {
      await $.store.set('off', true)
      await $.theme.clear()

      return { text: `The scene is off. /${COMMAND} on brings ${titleOf(current)} back.` }
    }
    const name = ON.includes(word) ? current : sceneNamed(word)

    if (name === undefined) {
      return { text: `No scene is called "${word}".\n${menu(current, isOff)}` }
    }
    await $.store.set('scene', name)
    await $.store.set('off', false)
    const set = await show($, name)

    return {
      text: set.isDrawn
        ? `Scene: ${titleOf(name)}`
        : `Scene: ${titleOf(name)}, kept for the desktop and mobile apps. Not drawn here: ${set.reason}`,
    }
  })

  // While Claude works, the scene's lamp is lit.
  on('turn.start', async ($, e, next) => {
    await working($, true)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await working($, false)

    return next(e)
  })

  // The sign follows the context window through a turn, one model response at
  // a time, and not only when the turn ends.
  on('turn.step', async function* ($, e, next) {
    const response = yield* next(e)

    if (e.agentId === undefined) {
      await follow($, (await $.session.usage()).context)
    }

    return response
  })

  on('session.measure', async ($, e, next) => {
    await follow($, e.context)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const name = e.props.scene
    const isOurs = e.props.plugin === PLUGIN && isScene(name)

    if (!isOurs || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const filled = await read($, percent)
    const source = drawScene(name, {
      t: Math.max(0, Math.min(1, filled / 100)),
      percent: filled < 0 ? undefined : filled,
      isBusy: await read($, busy),
      now: await $.clock.now(),
    })

    return <Svg source={source} alt={altOf(name)} isInteractive />
  })
}
