import express from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET || '')
const router = express.Router()

// Create a Stripe Checkout session for subscription (simplified)
router.post('/create-session', async (req,res)=>{
  try{
    const {priceId, successUrl, cancelUrl} = req.body
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{price: priceId, quantity: 1}],
      success_url: successUrl,
      cancel_url: cancelUrl
    })
    res.json({url: session.url})
  }catch(e){console.error(e); res.status(500).json({error:'Stripe error'})}
})

// Stripe webhook receiver (verify signature)
router.post('/webhook', (req,res)=>{
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event
  try{
    if(!webhookSecret){
      // no webhook secret configured; accept parsed body (only for local development)
      event = req.body
    } else {
      // use raw body saved by server.json verify middleware
      const raw = req.rawBody || req.body
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
    }
  }catch(err){
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event types you care about
  switch(event.type){
    case 'checkout.session.completed':
      // handle successful checkout session (subscription started)
      console.log('Checkout session completed', event.data.object.id)
      break
    case 'invoice.payment_succeeded':
      console.log('Invoice payment succeeded')
      break
    case 'customer.subscription.deleted':
      console.log('Subscription canceled')
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({received:true})
})

export default router
