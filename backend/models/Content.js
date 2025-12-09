import mongoose from 'mongoose'

const ContentSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: {type:String, enum:['image','video','blog'], default:'blog'},
  filepath: String,
  creator: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
  isPaid: {type:Boolean, default:false}
}, {timestamps:true})

export default mongoose.model('Content', ContentSchema)
