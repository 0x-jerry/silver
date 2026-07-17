import { runCompletion, formatOutput } from '../src/completion/engine'
import { silver } from '../src/core'

describe('completion engine', () => {
  it('should complete subcommands', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [dir], Test CLI. ${fn}

up, Upgrade command. ${fn}
down, Downgrade command. ${fn}
`

    ins.type('dir', ['dir1', 'dir2'])

    const output = await runCompletion(ins, [''])

    expect(output.groups.length).toBeGreaterThan(0)
    const cmdGroup = output.groups.find((g) => g.name === 'commands')
    expect(cmdGroup).toBeDefined()
    expect(cmdGroup!.values).toContainEqual(expect.stringContaining('up'))
    expect(cmdGroup!.values).toContainEqual(expect.stringContaining('down'))
  })

  it('should complete flag names', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [dir], Test CLI. ${fn}

-s --string @string, A string option.
-n --number @number, A number option.
`

    const output = await runCompletion(ins, ['--'])

    expect(output.groups.length).toBeGreaterThan(0)
    const optGroup = output.groups.find((g) => g.name === 'options')
    expect(optGroup).toBeDefined()
    expect(optGroup!.values).toContainEqual(expect.stringContaining('--string'))
    expect(optGroup!.values).toContainEqual(expect.stringContaining('--number'))
  })

  it('should complete positional args with types', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [@test:arg], Test CLI. ${fn}
`

    ins.type('test', ['value1', 'value2', { label: 'value3', desc: 'third value' }])

    const output = await runCompletion(ins, [''])

    expect(output.groups.length).toBeGreaterThan(0)
    const argGroup = output.groups.find((g) => g.name === 'test')
    expect(argGroup).toBeDefined()
    expect(argGroup!.values).toContain('value1')
    expect(argGroup!.values).toContain('value2')
    expect(argGroup!.values).toContain('value3\tthird value')
  })

  it('should emit _files group for _files type', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [@test|_files:arg], Test CLI. ${fn}
`

    ins.type('test', ['value1'])

    const output = await runCompletion(ins, [''])

    const filesGroup = output.groups.find((g) => g.name === '_files')
    expect(filesGroup).toBeDefined()
  })

  it('should emit _dirs group for _dirs type', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [@test|_dirs:arg], Test CLI. ${fn}
`

    ins.type('test', ['value1'])

    const output = await runCompletion(ins, [''])

    const dirsGroup = output.groups.find((g) => g.name === '_dirs')
    expect(dirsGroup).toBeDefined()
  })

  it('should emit _dirs group for _dirs flag value with =', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [arg], Test CLI. ${fn}

-d --dir @_dirs, A directory option.
`

    const output = await runCompletion(ins, ['--dir='])

    const dirsGroup = output.groups.find((g) => g.name === '_dirs')
    expect(dirsGroup).toBeDefined()
  })

  it('should emit _files group for _files flag value with =', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [arg], Test CLI. ${fn}

-f --file @_files, A file option.
`

    const output = await runCompletion(ins, ['--file='])

    const filesGroup = output.groups.find((g) => g.name === '_files')
    expect(filesGroup).toBeDefined()
  })

  it('should not include positional completions when typing a partial subcommand', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [@mytype:arg], Test CLI. ${fn}

up, Upgrade command. ${fn}
`

    ins.type('mytype', ['val1', 'val2'])

    const output = await runCompletion(ins, ['u'])

    const cmdGroup = output.groups.find((g) => g.name === 'commands')
    expect(cmdGroup).toBeDefined()

    const typeGroup = output.groups.find((g) => g.name === 'mytype')
    expect(typeGroup).toBeUndefined()
  })

  it('should not include positional completions when typing an exact subcommand name', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [arg], Test CLI. ${fn}

up [@mytype:dir], Upgrade command. ${fn}
`

    ins.type('mytype', ['up1', 'up2'])

    const output = await runCompletion(ins, ['up'])

    const typeGroup = output.groups.find((g) => g.name === 'mytype')
    expect(typeGroup).toBeUndefined()
  })

  it('should complete flag values when completing after a non-boolean flag', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [arg], Test CLI. ${fn}

-t --test @mytype|_files, A test option.
`

    ins.type('mytype', ['alpha', 'beta'])

    const output = await runCompletion(ins, ['-t', ''])

    const myGroup = output.groups.find((g) => g.name === 'mytype')
    expect(myGroup).toBeDefined()
    expect(myGroup!.values).toContain('alpha')
    expect(myGroup!.values).toContain('beta')

    const filesGroup = output.groups.find((g) => g.name === '_files')
    expect(filesGroup).toBeDefined()
  })

  it('should format output with groups', async () => {
    const output = {
      groups: [
        { name: 'commands', values: ['add\tAdd files', 'commit\tCommit changes'] },
        { name: 'options', values: ['--help\tShow help'] },
      ],
    }

    const formatted = formatOutput(output)

    expect(formatted).toContain('##commands')
    expect(formatted).toContain('add\tAdd files')
    expect(formatted).toContain('##options')
    expect(formatted).toContain('--help\tShow help')
  })

  it('should format output with group headers for single group', async () => {
    const output = {
      groups: [{ name: 'options', values: ['--help\tShow help'] }],
    }

    const formatted = formatOutput(output)

    expect(formatted).toContain('##options')
    expect(formatted).toContain('--help\tShow help')
  })

  it('should match first positional param when completing a partial word with _files', async () => {
    const fn = vi.fn()

    const ins = silver`
@manual @autocomplete

xx [@test|_files:a] [@test:b], Test CLI. ${fn}
`

    ins.type('test', ['value1'])

    const output = await runCompletion(ins, ['src/'])

    const filesGroup = output.groups.find((g) => g.name === '_files')
    expect(filesGroup).toBeDefined()
  })
})
