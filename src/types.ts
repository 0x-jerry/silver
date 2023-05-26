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

export interface CliConf {
  name: string

  description?: string

  options?: CliOption[]

  subCommands?: CliConf[]
}

export interface CliProgramConf extends Omit<CliConf, 'subCommands'> {
  subCommands?: CliProgramConf[]
}
