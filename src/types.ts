/**
 *
 * `#flag` syntax is not support yet.
 *
 * @example -o --option @type:defaultValue #flag, description
 */
export interface CmdOption {
  name?: string
  alias?: string

  type?: string
  defaultValue?: string | boolean | number

  description?: string

  /**
   * Not support
   *
   * @todo implement it
   *
   * {@link OptionFlag}
   */
  flags?: string[]
}

/**
 * @example [@type:name:defaultValue]        // optional parameter
 * @example <@type:name:defaultValue>        // required parameter
 * @example [...@type:name]                  // array parameters
 */
export interface CmdParameter {
  name: string
  required?: boolean
  type?: string
  defaultValue?: string | boolean | number
  handleRestAll?: boolean
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

  /**
   * {@link CommandFlag}
   */
  flags?: string[]

  parameters?: CmdParameter[]

  commands?: Command[]
}

export interface Program {
  /**
   * {@link ProgramFlag}
   */
  flags?: string[]

  command: Command

  actions?: Map<string, CmdAction>
}

export interface ActionParsedArgs {
  [arg: string]: any

  '--': string[]

  _: string[]
}

export interface CmdAction {
  <T extends ActionParsedArgs>(params: string[], opt: T): any
  (params: string[], opt: any): any
}

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
   * Add `completion` sub command
   */
  Autocompletion = 'autocompletion',
}

export enum OptionFlag {}

export type CompletionValue = string | { label: string; desc?: string }

export type CompletionType = Array<CompletionValue>

export enum BuiltinType {
  File = '_files',
}
