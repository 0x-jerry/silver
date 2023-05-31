/**
 * @example -o --option #flag @type:defaultValue, description
 */
export interface CmdOption {
  name: string
  alias?: string

  type?: string
  defaultValue?: string | boolean | number

  description?: string

  flags?: string[]
}

/**
 * @example [@type:name:defaultValue], not required, single
 * @example <@type:name:defaultValue>, required, single
 * @example [...@type:name:defaultValue] array
 */
export interface CmdParameter {
  name: string
  required?: boolean
  type?: string
  defaultValue?: string | boolean | number
  isArray?: boolean
}

export interface Command {
  name: string
  alias?: string

  /**
   * action identifier
   */
  action?: string

  description?: string

  options?: CmdOption[]

  flags?: string[]

  parameters?: CmdParameter[]

  commands?: Command[]
}

export interface Program {
  flags?: string[]

  command: Command

  actions?: Map<string, CmdAction>
}

export interface ActionParsedArgs {
  [arg: string]: any

  '--': string[]

  _: string[]
}

export type CmdAction = (opt: ActionParsedArgs) => any

// --- enums

export enum CommandFlag {
  /**
   * stop early when parse argv
   */
  StopEarly = 'stopEarly',
}

export enum ProgramFlag {
  /**
   * Manual execute
   */
  Manual = 'manual',

  /**
   * Generate help option `-h --help`
   */
  Help = 'help',

  /**
   * Add `completion` sub command
   */
  Autocompletion = 'autocompletion',
}

export enum OptionFlag {}
