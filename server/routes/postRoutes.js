import express from 'express'
import * as dotenv from 'dotenv'
import {v2 as cloudinary} from 'cloudinary'

import Post from '../mongoDB/models/post.js'

import sqlDb from '../mongoDB/sql.js'


dotenv.config()


const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
}
);


// Get All Post

//  using SQL DB
router.route('/').get(async(req,res)=>{

  const q = "SELECT * FROM aipost.posts"
 await sqlDb.query(q,(err,data)=>{

    if(err) return  res.json({success: false, message: err})
    return res.json({success: true,data})
  })


})



//  mongodb
// router.route('/').get(async(req,res)=>{
// try {
//   const posts = await Post.find({});


//   res.status(200).json({success: true, data: posts})
// } catch (error) {
//   res.status(500).json({success: false, message: error})
// }
// })



// Post

// sql

router.route('/').post(async(req,res)=>{
  const {name, prompt, photo} = req.body
  const photoUrl = await cloudinary.uploader.upload(photo)
  const q = 'INSERT INTO posts (name, prompt, photo) VALUES (?)';

const values= [name,prompt,photoUrl.url]
console.log('========values============================');
console.log(values);
console.log('=========values===========================');
await sqlDb.query(q,[values],(err,data)=>{

  if(err) return  res.json({success: false, message: err})
  return res.json({success: true,data})
})

})

// mongodb
// router.route('/').post(async(req,res)=>{

//   try {
//     const {name, prompt, photo} = req.body
// const photoUrl = await cloudinary.uploader.upload(photo)
// const newPost = await Post.create({
//   name,
//   prompt,
//   photo: photoUrl.url
// })

// res.status(201).json({success: true,data: newPost})
//   } catch (error) {

//     res.status(500).json({success: false, message: error})
//   }


// })

export default router;