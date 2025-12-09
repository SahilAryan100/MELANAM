import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setMsg('')
    try{
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({email,password,name})
      })
      const data = await res.json()
      if(!res.ok){ setMsg(data.error || 'Registration failed'); return }
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    }catch(e){ setMsg('Network error') }
  }

  return (
    <div style={{maxWidth:420}}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:8}}>
          <label>Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} type="text" style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" style={{width:'100%'}} />
        </div>
        <div style={{marginBottom:8}}>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" style={{width:'100%'}} />
        </div>
        <button type="submit">Register</button>
      </form>
      {msg && <p style={{color:'red'}}>{msg}</p>}
    </div>
  )
}
