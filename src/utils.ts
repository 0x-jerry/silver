import { toArray } from '@0x-jerry/utils'

export function splitFirst(text: string, separator: string) {
  const idx = text.indexOf(separator)

  return idx > -1 ? [text.slice(0, idx), text.slice(idx + separator.length)] : [text]
}

export const builtinType = {
  boolean: ['bool', 'boolean'],
  number: ['number'],
  string: ['string'],
}

export function isType(targetType: string | undefined, type: string | string[]) {
  return toArray(type).includes(targetType!)
}

export function isBuiltinType(type?: string) {
  return Object.values(builtinType).flat().includes(type!)
}
