import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function auth(req, res, next){
  try{
    const h = req.headers.authorization
    if(!h) return res.status(401).json({error:'No token'})
    const token = h.split(' ')[1]
    const data = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(data.id)
    if(!user) return res.status(401).json({error:'User not found'})
    req.userId = user._id
    req.user = user
    next()
  }catch(e){
    console.error('Auth middleware error', e.message)
    return res.status(401).json({error:'Invalid token'})
  }
}
