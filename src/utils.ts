export function splitFirst(text: string, separator: string) {
  const idx = text.indexOf(separator)

  return idx > -1 ? [text.slice(0, idx), text.slice(idx + separator.length)] : [text]
}
