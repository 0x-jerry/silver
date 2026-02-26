import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseProgram } from './semantics'

describe('syntax', () => {
  it('parse program', () => {
    const content = readFileSync(path.join(import.meta.dirname, './test.cli'), 'utf-8')

    expect(parseProgram(content)).toMatchSnapshot()
  })
})
