/**
 * @example -o --option #flag @type:defaultValue, description
 */
export interface CliOption {
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
export interface CliParameter {
  name: string
  required?: boolean
  type?: string
  defaultValue?: string | boolean | number
  isArray?: boolean
}

export interface CliConfig {
  name: string
  alias?: string

  description?: string

  options?: CliOption[]

  flags?: string[]

  parameters?: CliParameter[]

  subCommands?: CliConfig[]
}

export interface CliProgram extends Omit<CliConfig, 'subCommands'> {
  subCommands?: CliProgram[]
  action?: <T extends ActionParsedArgs = ActionParsedArgs>(args: T) => any
}

export interface ActionParsedArgs {
  [arg: string]: any

  '--': string[]

  _: string[]
}

export enum ProgramFlag {
  /**
   * Manual execute
   */
  Manual = 'manual',

  /**
   * stop early when parse argv
   */
  StopEarly = 'stopEarly',
}

export enum OptionFlag {}
