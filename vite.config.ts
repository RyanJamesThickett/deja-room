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
  build: {
    rolldownOptions: {
      output: {
        // Libraries change far less often than the game, so keep them in
        // their own files that browsers can go on caching across deploys.
        // (Each room's scene is split off by its dynamic import; see lazyScene.)
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/](\.pnpm[\\/])?(three|three-stdlib|@monogrid|fflate)/, priority: 2 },
            { name: 'react', test: /node_modules[\\/](\.pnpm[\\/])?(react|react-dom|scheduler|@react-three|its-fine|zustand|suspend-react|react-use-measure)/, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    // multiplayer: the match server from `pnpm mp` (wrangler dev), reached at /mp like the live one
    proxy: { '/mp': { target: 'http://127.0.0.1:8799', ws: true } },
  },
})
