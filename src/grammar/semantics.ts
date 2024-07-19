import type { CmdOption, CmdParameter, Command, Program } from '../types'
import grammar from './syntax.ohm-bundle'

interface OptionType {
  name: string
  defaultValue?: string
}

const semantics = grammar.createSemantics()

semantics.addOperation<any>('e', {
  _iter(...children) {
    return children.map((child) => child.e())
  },
  Program(version, programFlags, commands) {
    const [mainCommand, ...subCommands] = commands.e() as Command[]

    mainCommand.commands = subCommands

    const program: Program = {
      version: version.e().at(0),
      flags: programFlags.e(),
      command: mainCommand,
    }

    return program
  },
  Command(define, options) {
    const command = define.e() as Command

    command.options = options.e()

    return command
  },
  CommandDefinition(arg0) {
    return arg0.e()
  },
  CommandDefinition_shortcut(shortName, _, name, parameters, flags, _1, description) {
    const command: Command = {
      name: name.sourceString,
      alias: shortName.sourceString,
      description: description.sourceString,
      flags: flags.e(),
      parameters: parameters.e(),
    }

    return command
  },
  CommandDefinition_normal(name, parameters, flags, _, description) {
    const command: Command = {
      name: name.sourceString,
      description: description.sourceString,
      flags: flags.e(),
      parameters: parameters.e(),
    }

    return command
  },
  CommandParameter(arg0) {
    return arg0.e()
  },
  CommandParameter_optional(
    _l_parenthesis,
    handleRestFlag,
    type,
    name,
    defaultValue,
    _r_parenthesis
  ) {
    const parameter: CmdParameter = {
      name: name.sourceString,
      handleRestAll: !!handleRestFlag.sourceString,
      type: type.e().at(0),
      defaultValue: defaultValue.e().at(0),
    }

    return parameter
  },
  CommandParameter_required(
    _l_parenthesis,
    handleRestFlag,
    type,
    name,
    defaultValue,
    _r_parenthesis
  ) {
    const parameter: CmdParameter = {
      required: true,
      name: name.sourceString,
      handleRestAll: !!handleRestFlag.sourceString,
      type: type.e().at(0),
      defaultValue: defaultValue.e().at(0),
    }

    return parameter
  },
  CommandParameterDefaultValue(_, value) {
    return value.sourceString
  },
  CommandParameterType(typeFlag, _) {
    return typeFlag.e()
  },
  /**
   *
   * @param shortName eg. `-e`
   * @param name  eg. `--expand`
   * @param type
   * @param _
   * @param description
   * @returns
   */
  Option(shortName, name, type, _, description) {
    const _type: OptionType | undefined = type.e().at(0)

    const option: CmdOption = {
      name: name.sourceString.slice(2),
      alias: shortName.sourceString.slice(1),
      type: _type?.name,
      defaultValue: _type?.defaultValue,
      description: description.sourceString,
    }

    return option
  },
  OptionType(arg0) {
    return arg0.e()
  },
  OptionType_default(name, _, defaultValue) {
    const optionType: OptionType = {
      name: name.sourceString.slice(1),
      defaultValue: defaultValue.sourceString,
    }
    return optionType
  },
  OptionType_optional(name) {
    const optionType: OptionType = {
      name: name.sourceString.slice(1),
    }
    return optionType
  },
  hashFlag(_, name) {
    return name.sourceString
  },
  atFlag(_, name) {
    return name.sourceString
  },
  version(arg0, arg1, arg2, arg3, arg4, arg5) {
    return this.sourceString
  },
})

export function parseProgram(content: string) {
  const result = grammar.match(content)

  if (result.failed()) {
    throw new Error(result.message)
  }

  const p: Program = semantics(result).e()

  return p
}
