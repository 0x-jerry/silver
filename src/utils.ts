import { ensureArray } from '@0x-jerry/utils'

export const builtinType = {
  boolean: ['bool', 'boolean'],
  number: ['number'],
  string: ['string'],
}

export function isType(targetType: string | undefined, type: string | string[]) {
  if (!targetType) return false
  return ensureArray(type).includes(targetType)
}

export function isBuiltinType(type?: string) {
  if (!type) return false
  return Object.values(builtinType).flat().includes(type)
}
