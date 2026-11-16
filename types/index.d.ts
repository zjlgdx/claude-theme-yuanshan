declare module 'claude-code' {
  interface PluginState {
    yuanshan: {
      /** How full the context window is, as a whole percentage; -1 before the first reading. */
      percent: number
      /** Whether Claude is working on a turn. */
      busy: boolean
    }
  }
}

/** A scene's name, as the command takes it. */
export type Scene = 'mountains' | 'sea' | 'rain' | 'bamboo' | 'snow'
