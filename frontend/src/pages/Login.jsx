import React, {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setMsg('')
    try{
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({email,password})
      })
      const data = await res.json()
      if(!res.ok){ setMsg(data.error || 'Login failed'); return }
      // store access token in localStorage for now; refresh token is set as httpOnly cookie
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    }catch(e){ setMsg('Network error') }
  }

  async function handleRefresh(){
    try{
      // call refresh endpoint; cookie is sent automatically with credentials: 'include'
      const res = await fetch('/api/auth/refresh', {
        method:'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if(!res.ok){ setMsg(data.error || 'Refresh failed'); return }
      localStorage.setItem('accessToken', data.accessToken)
      setMsg('Token refreshed')
    }catch(e){ setMsg('Network error') }
  }

  return (
    <div style={{maxWidth:420}}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:8}}>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" style={{width:'100%'}} />
        </div>
        <button type="submit">Login</button>
      </form>
      <div style={{marginTop:12}}>
        <button onClick={handleRefresh}>Refresh token</button>
      </div>
      <div style={{marginTop:12}}>
        <Link to="/register">Create an account</Link>
      </div>
      {msg && <p style={{color:'red'}}>{msg}</p>}
    </div>
  )
}
