import express from 'express'
import User from '../models/User.js'
import auth from '../middleware/auth.js'
import Stripe from 'stripe'
import { isSupportedCurrency } from '../utils/stripeCurrencies.js'

const stripe = new Stripe(process.env.STRIPE_SECRET || '')

const router = express.Router()

// Return basic public creator info (name, stripePriceId)
router.get('/:id', async (req,res)=>{
  try{
    const u = await User.findById(req.params.id).select('name stripePriceId role')
    if(!u) return res.status(404).json({error:'Creator not found'})
    if(u.role !== 'creator') return res.status(404).json({error:'Creator not found'})
    res.json({id: u._id, name: u.name, priceId: u.stripePriceId || null})
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}) }
})

// Allow authenticated creator to set their stripePriceId
router.put('/:id/price', auth, async (req,res)=>{
  try{
    const { priceId } = req.body
    if(!priceId) return res.status(400).json({error:'priceId required'})
    // only allow the creator themself to update their price
    if(req.user._id.toString() !== req.params.id) return res.status(403).json({error:'Forbidden'})
    if(req.user.role !== 'creator') return res.status(403).json({error:'Only creators can set price'})

    if(!process.env.STRIPE_SECRET) return res.status(500).json({error:'Stripe not configured on server'})

    // validate price exists and is a recurring price
    let price
    try{
      price = await stripe.prices.retrieve(priceId)
    }catch(err){
      console.error('Stripe price retrieve error', err?.message || err)
      return res.status(400).json({error:'Invalid priceId or Stripe error'})
    }

    if(!price || price.deleted) return res.status(400).json({error:'Price not found or deleted'})
    if(!price.recurring) return res.status(400).json({error:'Price is not recurring; subscriptions require recurring prices'})
    if(!price.active) return res.status(400).json({error:'Price is not active'})

    // optional: ensure reasonable amount
    if(typeof price.unit_amount !== 'number' || price.unit_amount <= 0) return res.status(400).json({error:'Price has invalid unit_amount'})

    // currency check: ensure price currency matches creator preferred currency
    const pref = req.user.preferredCurrency || 'usd'
    if(price.currency && price.currency.toLowerCase() !== pref.toLowerCase()){
      return res.status(400).json({error:`Price currency (${price.currency}) does not match your preferred currency (${pref}). Create a price with ${pref} or update your preferred currency.`})
    }

    // passed validation; persist
    req.user.stripePriceId = priceId
    await req.user.save()
    res.json({ok:true, priceId: req.user.stripePriceId, price: {unit_amount: price.unit_amount, currency: price.currency, interval: price.recurring.interval}})
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}) }
})

// Create a Stripe Product and Price and persist the priceId on the creator
router.post('/:id/price/create', auth, async (req,res)=>{
  try{
    const { amount, currency = 'usd', interval = 'month', productName } = req.body
    if(!amount || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({error:'Invalid amount'})
    if(!isSupportedCurrency(currency)) return res.status(400).json({error:'Currency not supported'})
    if(req.user._id.toString() !== req.params.id) return res.status(403).json({error:'Forbidden'})
    if(req.user.role !== 'creator') return res.status(403).json({error:'Only creators can create prices'})

    // Create or reuse a product. Use provided name or a default per-creator product.
    const prodName = productName || `MELANAM Creator ${req.user._id}`
    const product = await stripe.products.create({name: prodName})

    // Stripe expects amount in smallest currency unit (cents)
    const amountInt = Math.round(Number(amount) * 100)
    const price = await stripe.prices.create({
      unit_amount: amountInt,
      currency,
      recurring: {interval},
      product: product.id
    })

    // persist price id on user
    req.user.stripePriceId = price.id
    // if currency differs from preferred, update preferredCurrency to match the newly created price
    if(req.user.preferredCurrency !== price.currency){
      req.user.preferredCurrency = price.currency
    }
    await req.user.save()

    res.json({ok:true, priceId: price.id, productId: product.id, preferredCurrency: req.user.preferredCurrency})
  }catch(e){
    console.error('Create price error', e)
    res.status(500).json({error:'Server error'})
  }
})

// Update creator preferred currency (protected)
router.put('/:id/preferred-currency', auth, async (req,res)=>{
  try{
    const { currency } = req.body
    if(!currency || typeof currency !== 'string' || currency.length !== 3) return res.status(400).json({error:'Invalid currency code'})
    if(!isSupportedCurrency(currency)) return res.status(400).json({error:'Currency not supported'})
    if(req.user._id.toString() !== req.params.id) return res.status(403).json({error:'Forbidden'})
    if(req.user.role !== 'creator') return res.status(403).json({error:'Only creators can set preferred currency'})

    // normalize
    const cur = currency.toLowerCase()
    req.user.preferredCurrency = cur
    await req.user.save()
    res.json({ok:true, preferredCurrency: cur})
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}) }
})

export default router
