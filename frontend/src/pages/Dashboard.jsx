import React, {useEffect, useState, useRef} from 'react'
import {fetchWithAuth, logout} from '../api'

export default function Dashboard() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    let mounted = true
    async function load() {
      setMsg('Loading...')
      const res = await fetchWithAuth('/api/content')
      if (!res.ok) { setMsg('Failed to load content'); return }
      const data = await res.json()
      if (mounted) { setItems(data.items || []); setMsg('') }
    }
    load()
    return () => mounted = false
  }, [])

  async function handleUpload(e) {
    e.preventDefault()
    const f = fileRef.current.files[0]
    if (!f) return setMsg('Select a file')
    const form = new FormData()
    form.append('file', f)
    form.append('title', f.name)
    form.append('description', 'Uploaded from dashboard')
    form.append('type', f.type.startsWith('video') ? 'video' : (f.type.startsWith('image') ? 'image' : 'blog'))
    form.append('isPaid', 'false')
    const res = await fetchWithAuth('/api/content/upload', { method: 'POST', body: form })
    if (!res.ok) return setMsg('Upload failed')
    const data = await res.json()
    setItems(i => [data.content, ...i])
    setMsg('Upload successful')
  }

  async function handleLogout() {
    await logout()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Welcome{user?.name ? `, ${user.name}` : ''}</h2>
          <div style={{ fontSize: 12, color: '#666' }}>{user?.email}</div>
        </div>
        <div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <section style={{ marginTop: 20 }}>
        <h3>Upload content</h3>
        <form onSubmit={handleUpload}>
          <input ref={fileRef} type="file" />
          <button type="submit">Upload</button>
        </form>
        {msg && <div style={{ color: 'green', marginTop: 8 }}>{msg}</div>}
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Recent content</h3>
        {items.length === 0 && <div>No content yet.</div>}
        <ul style={{ padding: 0, listStyle: 'none' }}>
          {items.map(it => (
            <li key={it._id || it.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{it.description}</div>
                  {it.filepath && <div style={{ marginTop: 8 }}><a href={`/${it.filepath.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer">View file</a></div>}
                  {it.creator && <div style={{marginTop:8}}><a href={`/creator/${it.creator}`}>Creator profile</a> — <button style={{marginLeft:8}} onClick={()=>window.location.href = `/subscribe?priceId=price_for_${it.creator}`}>Subscribe</button></div>}
                </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
