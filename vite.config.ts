import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { appendFile, mkdir } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'

/**
 * Dev only: the in-game bug notes (hold P) are POSTed to /__notes and
 * appended to notes/notes.jsonl, one JSON object per line, so they can be
 * read straight from the project folder.
 */
function bugNotes(): Plugin {
  return {
    name: 'bug-notes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__notes', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk: Buffer) => (body += chunk.toString()))
        req.on('end', () => {
          void (async () => {
            try {
              const note: unknown = JSON.parse(body)
              await mkdir('notes', { recursive: true })
              await appendFile('notes/notes.jsonl', `${JSON.stringify(note)}\n`)
              res.statusCode = 204
            } catch {
              res.statusCode = 400
            }
            res.end()
          })()
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), bugNotes()],
})
