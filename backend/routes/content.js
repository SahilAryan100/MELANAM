import express from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import Content from '../models/Content.js'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req,file,cb)=> cb(null, 'uploads/'),
  filename: (req,file,cb)=> cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({storage})

function auth(req,res,next){
  const h = req.headers.authorization
  if(!h) return res.status(401).json({error:'No token'})
  const token = h.split(' ')[1]
  try{
    const data = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = data.id
    next()
  }catch(e){return res.status(401).json({error:'Invalid token'})}
}

router.post('/upload', auth, upload.single('file'), async (req,res)=>{
  try{
    const {title,description,type,isPaid} = req.body
    const content = await Content.create({
      title, description, type, filepath: req.file.path, creator: req.userId, isPaid: isPaid === 'true'
    })
    res.json({content})
  }catch(e){console.error(e); res.status(500).json({error:'Upload failed'})}
})

router.get('/', async (req,res)=>{
  const items = await Content.find().sort({createdAt:-1}).limit(50)
  res.json({items})
})

export default router
