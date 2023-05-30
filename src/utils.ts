import { toArray } from '@0x-jerry/utils'

export function splitFirst(text: string, separator: string) {
  const idx = text.indexOf(separator)

  return idx > -1 ? [text.slice(0, idx), text.slice(idx + separator.length)] : [text]
}

export const builtinType = {
  boolean: ['bool', 'boolean'],
  number: ['number'],
}

export function isType(targetType: string, type: string | string[]) {
  return toArray(type).includes(targetType)
}
