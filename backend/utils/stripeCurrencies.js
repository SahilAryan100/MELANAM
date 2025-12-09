import fs from 'fs'
import path from 'path'

// Load currency list from config file so it can be updated without code changes.
const cfgPath = path.join(process.cwd(), 'backend', 'config', 'currencies.json')
let SUPPORTED_CURRENCIES = []
try{
  const raw = fs.readFileSync(cfgPath, 'utf8')
  const parsed = JSON.parse(raw)
  if(Array.isArray(parsed)) SUPPORTED_CURRENCIES = parsed.map(c=>String(c).toLowerCase())
}catch(e){
  // fallback to a small default list
  SUPPORTED_CURRENCIES = ['usd','eur','gbp','inr']
}

export function isSupportedCurrency(code){
  if(!code || typeof code !== 'string') return false
  return SUPPORTED_CURRENCIES.includes(code.toLowerCase())
}

export function getSupportedCurrencies(){
  return SUPPORTED_CURRENCIES.slice()
}
