// Simple auth-aware fetch helper: attaches access token and attempts refresh on 401
export async function fetchWithAuth(input, init = {}){
  init.headers = init.headers || {}
  const token = localStorage.getItem('accessToken')
  if(token) init.headers['Authorization'] = `Bearer ${token}`
  init.credentials = init.credentials || 'include'

  let res = await fetch(input, init)
  if(res.status !== 401) return res

  // attempt refresh (cookie-based)
  const r = await fetch('/api/auth/refresh', {method:'POST', credentials:'include'})
  if(!r.ok) return res
  const data = await r.json()
  if(data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken)
    init.headers['Authorization'] = `Bearer ${data.accessToken}`
    res = await fetch(input, init)
  }
  return res
}

export function logout(){
  // call backend to clear cookie and revoke
  return fetch('/api/auth/logout', {method:'POST', credentials:'include'})
}
