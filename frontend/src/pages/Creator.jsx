import React, {useEffect, useState} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {fetchWithAuth} from '../api'

export default function Creator(){
  const {id} = useParams()
  const navigate = useNavigate()
  const [creator, setCreator] = useState(null)
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [newCurrency, setNewCurrency] = useState('usd')
  const [newInterval, setNewInterval] = useState('month')
  const [newProductName, setNewProductName] = useState('')
  const [editingCurrency, setEditingCurrency] = useState(false)
  const [currencyInput, setCurrencyInput] = useState('')

  const me = (()=>{ try{ return JSON.parse(localStorage.getItem('user')) }catch{return null}})()

  useEffect(()=>{
    let mounted = true
    async function load(){
      setMsg('Loading...')
      const res = await fetchWithAuth(`/api/creators/${id}`)
      if(!res.ok){ setMsg('Creator not found'); return }
      const data = await res.json()
      if(mounted){ setCreator(data); setMsg('') }
    }
    load()
    return ()=> mounted = false
  },[id])

  function handleSubscribe(){
    const pid = creator?.priceId || `price_for_${id}`
    navigate(`/subscribe?priceId=${encodeURIComponent(pid)}`)
  }

  if(msg) return <div>{msg}</div>
  if(!creator) return <div>Loading...</div>

  async function savePrice(){
    setMsg('Saving...')
    try{
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/creators/${id}/price`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({priceId: priceInput})
      })
      const data = await res.json()
      if(!res.ok) return setMsg(data.error || 'Save failed')
      setCreator(c => ({...c, priceId: data.priceId}))
      setEditing(false)
      setMsg('Saved')
    }catch(e){ setMsg('Network error') }
  }

  async function createPrice(){
    setCreating(true)
    setMsg('Creating price...')
    try{
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/creators/${id}/price/create`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ amount: newAmount, currency: newCurrency, interval: newInterval, productName: newProductName })
      })
      const data = await res.json()
      if(!res.ok) return setMsg(data.error || 'Create failed')
      setCreator(c => ({...c, priceId: data.priceId}))
      setMsg('Price created')
    }catch(e){ setMsg('Network error') }
    setCreating(false)
  }

  async function savePreferredCurrency(){
    setMsg('Saving preferred currency...')
    try{
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/creators/${id}/preferred-currency`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ currency: currencyInput })
      })
      const data = await res.json()
      if(!res.ok) return setMsg(data.error || 'Save failed')
      setCreator(c => ({...c, preferredCurrency: data.preferredCurrency}))
      setEditingCurrency(false)
      setMsg('Preferred currency updated')
    }catch(e){ setMsg('Network error') }
  }

  return (
    <div style={{maxWidth:640}}>
      <h2>{creator.name || `Creator ${id}`}</h2>
      <p>Subscription Price ID: <strong>{creator.priceId || 'Not set'}</strong></p>
      <p>Preferred currency: <strong>{creator.preferredCurrency || 'usd'}</strong></p>
      {me && me.id === id && !editingCurrency && (
        <div style={{marginTop:8}}><button onClick={()=>{ setEditingCurrency(true); setCurrencyInput(creator.preferredCurrency || 'usd') }}>Edit preferred currency</button></div>
      )}

      {editingCurrency && (
        <div style={{marginTop:8}}>
          <input value={currencyInput} onChange={e=>setCurrencyInput(e.target.value)} style={{width:120}} />
          <button style={{marginLeft:8}} onClick={savePreferredCurrency}>Save</button>
          <button style={{marginLeft:8}} onClick={()=>setEditingCurrency(false)}>Cancel</button>
        </div>
      )}
      <div style={{marginTop:12}}>
        <button onClick={handleSubscribe}>Subscribe</button>
        {me && me.id === id && (
          <>
            <button style={{marginLeft:8}} onClick={()=>{ setEditing(true); setPriceInput(creator.priceId || '') }}>Edit Price</button>
          </>
        )}
      </div>

      {editing && (
        <div style={{marginTop:12}}>
          <input value={priceInput} onChange={e=>setPriceInput(e.target.value)} style={{width:320}} />
          <button style={{marginLeft:8}} onClick={savePrice}>Save</button>
          <button style={{marginLeft:8}} onClick={()=>setEditing(false)}>Cancel</button>
        </div>
      )}
      {/* Create new Stripe Price */}
      {me && me.id === id && (
        <div style={{marginTop:20, padding:12, border:'1px dashed #ddd'}}>
          <h4>Create Stripe Price</h4>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input placeholder="Amount (e.g. 4.99)" value={newAmount} onChange={e=>setNewAmount(e.target.value)} style={{width:140}} />
            <select value={newCurrency} onChange={e=>setNewCurrency(e.target.value)}>
              <option value="usd">USD</option>
              <option value="inr">INR</option>
              <option value="eur">EUR</option>
            </select>
            <select value={newInterval} onChange={e=>setNewInterval(e.target.value)}>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div style={{marginTop:8}}>
            <input placeholder="Product name (optional)" value={newProductName} onChange={e=>setNewProductName(e.target.value)} style={{width:320}} />
          </div>
          <div style={{marginTop:8}}>
            <button onClick={createPrice} disabled={creating}>Create Price</button>
          </div>
        </div>
      )}
      {msg && <div style={{marginTop:8,color:'#064e3b'}}>{msg}</div>}
    </div>
  )
}
