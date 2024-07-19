// AUTOGENERATED FILE
// This file was generated from syntax.ohm by `ohm generateBundles`.

import {
  BaseActionDict,
  Grammar,
  IterationNode,
  Node,
  NonterminalNode,
  Semantics,
  TerminalNode
} from 'ohm-js';

export interface SilverActionDict<T> extends BaseActionDict<T> {
  Program?: (this: NonterminalNode, arg0: IterationNode, arg1: IterationNode) => T;
  Option?: (this: NonterminalNode, arg0: IterationNode, arg1: NonterminalNode, arg2: IterationNode, arg3: TerminalNode, arg4: NonterminalNode) => T;
  optionShortName?: (this: NonterminalNode, arg0: TerminalNode, arg1: NonterminalNode) => T;
  optionName?: (this: NonterminalNode, arg0: TerminalNode, arg1: IterationNode) => T;
  OptionType_default?: (this: NonterminalNode, arg0: NonterminalNode, arg1: TerminalNode, arg2: NonterminalNode) => T;
  OptionType_optional?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  OptionType?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  defaultValue?: (this: NonterminalNode, arg0: IterationNode) => T;
  Command?: (this: NonterminalNode, arg0: NonterminalNode, arg1: IterationNode) => T;
  CommandDefinition_shortcut?: (this: NonterminalNode, arg0: NonterminalNode, arg1: TerminalNode, arg2: NonterminalNode, arg3: IterationNode, arg4: IterationNode, arg5: TerminalNode, arg6: NonterminalNode) => T;
  CommandDefinition_normal?: (this: NonterminalNode, arg0: NonterminalNode, arg1: IterationNode, arg2: IterationNode, arg3: TerminalNode, arg4: NonterminalNode) => T;
  CommandDefinition?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  CommandShortName?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  CommandName?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  CommandParameter_optional?: (this: NonterminalNode, arg0: TerminalNode, arg1: IterationNode, arg2: IterationNode, arg3: NonterminalNode, arg4: IterationNode, arg5: TerminalNode) => T;
  CommandParameter_required?: (this: NonterminalNode, arg0: TerminalNode, arg1: IterationNode, arg2: IterationNode, arg3: NonterminalNode, arg4: IterationNode, arg5: TerminalNode) => T;
  CommandParameter?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  CommandParameterDefaultValue?: (this: NonterminalNode, arg0: TerminalNode, arg1: NonterminalNode) => T;
  CommandParameterType?: (this: NonterminalNode, arg0: NonterminalNode, arg1: TerminalNode) => T;
  CommandParameterName?: (this: NonterminalNode, arg0: NonterminalNode) => T;
  atFlag?: (this: NonterminalNode, arg0: TerminalNode, arg1: NonterminalNode) => T;
  hashFlag?: (this: NonterminalNode, arg0: TerminalNode, arg1: NonterminalNode) => T;
  description?: (this: NonterminalNode, arg0: IterationNode) => T;
  word?: (this: NonterminalNode, arg0: IterationNode) => T;
}

export interface SilverSemantics extends Semantics {
  addOperation<T>(name: string, actionDict: SilverActionDict<T>): this;
  extendOperation<T>(name: string, actionDict: SilverActionDict<T>): this;
  addAttribute<T>(name: string, actionDict: SilverActionDict<T>): this;
  extendAttribute<T>(name: string, actionDict: SilverActionDict<T>): this;
}

export interface SilverGrammar extends Grammar {
  createSemantics(): SilverSemantics;
  extendSemantics(superSemantics: SilverSemantics): SilverSemantics;
}

declare const grammar: SilverGrammar;
export default grammar;
