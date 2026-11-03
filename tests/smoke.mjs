const base = 'http://localhost:5173/api/specboard'
const post = async (r, b) => {
  const res = await fetch(base + r, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b ?? {}) })
  return [res.status, await res.json()]
}
const [s0, info] = await post('/info')
console.log('info', s0, info.exampleRoot)
const copy = process.argv[2]
const [s1, o] = await post('/open', { root: copy })
console.log('open', s1, Object.keys(o.files ?? {}).length, 'files', o.git)
const tasksPath = 'specs/001-mapa/tasks.md'
const f = o.files[tasksPath]
const [s2, w] = await post('/write', { path: tasksPath, content: f.content.replace('status: backlog', 'status: done'), expectedHash: f.hash })
console.log('write', s2, w.file?.hash?.slice(0, 8))
const [s3, c] = await post('/write', { path: tasksPath, content: 'x', expectedHash: f.hash })
console.log('stale write', s3, c.error)
console.log('traversal', (await post('/write', { path: '../evil.md', content: 'x', expectedHash: null }))[0])
console.log('abs', (await post('/write', { path: 'C:/evil.md', content: 'x', expectedHash: null }))[0])
console.log('bad ext', (await post('/write', { path: 'a.sh', content: 'x', expectedHash: null }))[0])
const evil = await fetch(base + '/info', { method: 'POST', headers: { Origin: 'http://evil.com' }, body: '{}' })
console.log('foreign origin', evil.status)
