import { ensureArray } from '@0x-jerry/utils'

export const builtinType = {
  boolean: ['bool', 'boolean'],
  number: ['number'],
  string: ['string'],
}

export function isType(targetType: string | undefined, type: string | string[]) {
  return ensureArray(type).includes(targetType!)
}

export function isBuiltinType(type?: string) {
  return Object.values(builtinType).flat().includes(type!)
}
