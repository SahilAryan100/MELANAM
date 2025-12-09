import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: String,
  email: {type:String, unique:true},
  password: String,
  role: {type:String, enum:['creator','subscriber'], default:'subscriber'},
  stripeCustomerId: String,
  subscriptionStatus: String,
  stripePriceId: String,
  preferredCurrency: { type: String, default: 'usd' },
  refreshTokens: { type: [String], default: [] }
}, {timestamps:true})

export default mongoose.model('User', UserSchema)
