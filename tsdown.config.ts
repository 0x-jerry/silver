import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  clean: true,
  format: ['esm'],
  plugins: [
    {
      name: 'tsdown-plugin-raw-query',
      resolveId(id, importer) {
        if (id.endsWith('?raw')) {
          const rawPath = id.replace(/\?raw$/, '')
          if (importer && rawPath.startsWith('.')) {
            const resolved = path.resolve(path.dirname(importer), rawPath)
            return resolved + '?raw'
          }
          return id
        }
        return null
      },
      load(id) {
        if (id.endsWith('?raw')) {
          const filePath = id.replace(/\?raw$/, '')
          const content = fs.readFileSync(filePath, 'utf-8')
          return {
            code: `export default ${JSON.stringify(content)};`,
            loader: 'js',
          }
        }
        return null
      },
    },
  ],
})
