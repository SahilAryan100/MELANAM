import React from 'react'
import { Outlet } from 'react-router-dom'
import Logo from './logo.svg'

export default function App(){
  return (
    <div>
      <header style={{display:'flex',alignItems:'center',gap:12,padding:12, borderBottom:'1px solid #eee'}}>
        <img src={Logo} alt="MELANAM logo" style={{width:36,height:36}} />
        <div style={{fontWeight:700, fontSize:18}}>MELANAM 🤝</div>
      </header>
      <main style={{padding:12}}>
        <Outlet />
      </main>
    </div>
  )
}
