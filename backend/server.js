import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import paymentRoutes from './routes/payments.js'
import creatorsRoutes from './routes/creators.js'
import path from 'path'

dotenv.config()
const app = express()
app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:3000',
	credentials: true
}))
// preserve raw body for Stripe webhook verification when stripe-signature header present
app.use(express.json({
	verify: (req, res, buf) => {
		if (req.headers['stripe-signature']) {
			req.rawBody = buf
		}
	}
}))
app.use(cookieParser())

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/creators-app'
mongoose.connect(MONGO).then(()=>console.log('MongoDB connected')).catch(err=>console.error(err))

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/creators', creatorsRoutes)

// serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))
