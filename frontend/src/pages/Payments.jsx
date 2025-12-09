import React, {useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'

export default function Payments(){
  const [priceId, setPriceId] = useState('')
  const [msg, setMsg] = useState('')
  const loc = useLocation()

  // prefill priceId from query param if present
  useEffect(()=>{
    const q = new URLSearchParams(loc.search)
    const p = q.get('priceId')
    if(p) setPriceId(p)
  },[loc.search])

  async function handleCheckout(e){
    e.preventDefault()
    setMsg('Creating checkout session...')
    try{
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({priceId, successUrl: window.location.origin + '/dashboard', cancelUrl: window.location.origin + '/'})
      })
      const data = await res.json()
      if(!res.ok) return setMsg(data.error || 'Failed to create session')
      // redirect to Stripe Checkout
      window.location.href = data.url
    }catch(e){ setMsg('Network error') }
  }

  return (
    <div style={{maxWidth:560}}>
      <h2>Subscribe / Checkout</h2>
      <p>Enter a Stripe Price ID (create one in your Stripe dashboard) and click Checkout.</p>
      <form onSubmit={handleCheckout}>
        <div style={{marginBottom:8}}>
          <label>Price ID</label>
          <input value={priceId} onChange={e=>setPriceId(e.target.value)} style={{width:'100%'}} placeholder="price_1Hh1XYZ..." />
        </div>
        <button type="submit">Checkout</button>
      </form>
      {msg && <div style={{marginTop:8,color:'#b91c1c'}}>{msg}</div>}
    </div>
  )
}
