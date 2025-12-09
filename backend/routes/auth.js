import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

function generateAccessToken(id){
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '15m'})
}

function generateRefreshToken(id){
  return jwt.sign({id}, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {expiresIn: '7d'})
}

router.post('/register', async (req,res)=>{
  try{
    const {email,password,name} = req.body
    if(!email||!password) return res.status(400).json({error:'Missing fields'})
    const existing = await User.findOne({email})
    if(existing) return res.status(400).json({error:'User exists'})
    const hash = await bcrypt.hash(password, 10)
    const u = await User.create({email, password:hash, name})
    const accessToken = generateAccessToken(u._id)
    const refreshToken = generateRefreshToken(u._id)
    u.refreshTokens.push(refreshToken)
    await u.save()
    // set httpOnly refresh cookie
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
    res.cookie('refreshToken', refreshToken, cookieOpts)
    res.json({user:{id:u._id,email:u.email,name:u.name}, accessToken})
  }catch(e){console.error(e); res.status(500).json({error:'Server error'})}
})

router.post('/login', async (req,res)=>{
  try{
    const {email,password} = req.body
    const u = await User.findOne({email})
    if(!u) return res.status(400).json({error:'Invalid creds'})
    const ok = await bcrypt.compare(password, u.password)
    if(!ok) return res.status(400).json({error:'Invalid creds'})
    const accessToken = generateAccessToken(u._id)
    const refreshToken = generateRefreshToken(u._id)
    // rotate / store
    u.refreshTokens.push(refreshToken)
    await u.save()
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
    res.cookie('refreshToken', refreshToken, cookieOpts)
    res.json({user:{id:u._id,email:u.email,name:u.name}, accessToken})
  }catch(e){console.error(e); res.status(500).json({error:'Server error'})}
})

// Refresh access token
router.post('/refresh', async (req,res)=>{
  try{
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!refreshToken) return res.status(400).json({error:'Missing refresh token'})
    let payload
    try{ payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) }
    catch(e){ return res.status(401).json({error:'Invalid refresh token'}) }
    const user = await User.findById(payload.id)
    if(!user) return res.status(401).json({error:'User not found'})
    if(!user.refreshTokens.includes(refreshToken)) return res.status(401).json({error:'Refresh token not recognized'})
    const newAccessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)
    user.refreshTokens = user.refreshTokens.filter(t=>t!==refreshToken)
    user.refreshTokens.push(newRefreshToken)
    await user.save()
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
    res.cookie('refreshToken', newRefreshToken, cookieOpts)
    res.json({accessToken: newAccessToken})
  }catch(e){console.error(e); res.status(500).json({error:'Server error'})}
})

// Logout (revoke refresh token)
router.post('/logout', async (req,res)=>{
  try{
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!refreshToken) {
      // clear cookie anyway
      res.clearCookie('refreshToken', {path:'/api/auth'})
      return res.json({ok:true})
    }
    let payload
    try{ payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) }
    catch(e){ res.clearCookie('refreshToken', {path:'/api/auth'}); return res.json({ok:true}) }
    const user = await User.findById(payload.id)
    if(user){
      user.refreshTokens = user.refreshTokens.filter(t=>t!==refreshToken)
      await user.save()
    }
    res.clearCookie('refreshToken', {path:'/api/auth'})
    res.json({ok:true})
  }catch(e){console.error(e); res.status(500).json({error:'Server error'})}
})

export default router
