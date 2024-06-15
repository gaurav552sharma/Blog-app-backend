const Post = require('../models/postModel')
const User = require('../models/userModel')
const path = require('path')
const fs = require('fs')
const uuid = require('uuid').v4;
const HttpError = require('../models/errorModel')


//*********************CREATE A POST*******************
//post:api/posts
//Protected

const createPost = async (req, res, next) => {
    try {
        const {title, category, description} = req.body;
        if(!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields and choose thumbnail.", 422))
        }
        const {thumbnail} = req.files; 
        //check the file size
        if(thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big File should be less than 2mb"))
        }
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if (err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({title, category, description, thumbnail: newFilename, creator: req.user.id})
                if(!newPost) {
                    return next(new HttpError("Post couldn't be created.", 422))
                }
                //find user and increate post count by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
};

//*********************GET ALL POST*******************
//get:api/posts
//UnProtected

const getPosts = async (req, res, next) => {
  try{
       const posts=await Post.find().sort({updatedAt:-1});
       res.status(200).json(posts);
  } catch (error) {
        return next(new HttpError(error))
}
};

//*********************GET SINGLE POST*******************
//get:api/posts/:id
//Protected

const getPost = async (req, res, next) => {
  try{
   const postID=req.params.id;
   const post= await Post.findById(postID);

    if(!post){
        return next(new HttpError("post not found",404));
    }
    res.status(200).json(post);

  }catch (error) {
    return next(new HttpError(error))
}
};

//*********************GET POSTS BY CATEGORY*******************
//get:api/posts/categories/:category
//unProtected

const getCatPosts = async (req, res, next) => {
  try{
    const {category}=req.params;
    const posts=await Post.find({category}).sort({updatedAt:-1});
      res.status(200).json(posts);

  }catch (error) {
    return next(new HttpError(error))
}
};

//*********************GET USER POST*******************
//get:api/posts/users/:id
//unProtected

const getUserPosts = async (req, res, next) => {
  try{
     const {id}=req.params;
     const posts=await Post.find({creator:id}).sort({createdAt:-1});

     res.status(200).json(posts);

  }catch (error) {
    return next(new HttpError(error))
}
};

//*********************EDIT POST*******************
//patch:api/posts/:id
//Protected

const editPost = async (req, res, next) => {
  try{
  let updatedPost;
  const postID=req.params.id;
  let {title,description,category}=req.body;

  if(!title || !category || description.length<12 ){
     return next(new HttpError("Fill all the fields",422))
  }
  const oldPost=await Post.findById(postID);
  if(req.user.id==oldPost.creator){
  if(!req.files){
    updatedPost=await Post.findByIdAndUpdate(postID,{title,description,category},{new:true});
  }else{
     const oldPost=await Post.findById(postID);
      
     fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), (err) => {
      if(err) {
          return next(new HttpError(err))
      }
      })
      
      const {thumbnail}=req.files;
      if(thumbnail > 2000000) {
        return next(new HttpError("Profile picture too big Should be less than 2mb"))
    }
    let fileName;
    fileName = thumbnail.name;
    let splittedFilename = fileName.split('.')
    let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length -1]
    thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
        if(err) {
            return next(new HttpError(err));
        }
      })

    updatedPost=await Post.findByIdAndUpdate(postID,{title,description,category,thumbnail:newFilename},{new:true})

  }
   if(!updatedPost){
    return next(new HttpError("Couldn't Update Post"),400);
   }
   
   res.status(200).json(updatedPost);
  }else{
    return next(new HttpError(" You Can't Update others Post"),400);
  }
  }catch (error) {
    return next(new HttpError(error))
}
};

//*********************DELETE POST*******************
//delete:api/posts/:id
//Protected

const deletePost = async (req, res, next) => {
  try{
   const postID=req.params.id;
   if(!postID){
      return  next(new HttpError("Post Unavailable",400));
   }

  const post=await Post.findById(postID);
  const fileName=post?.thumbnail;
  if(req.user.id==post.creator){
    fs.unlink(path.join(__dirname, '..', 'uploads', fileName),async (err) => {
      if(err) {
          return next(new HttpError(err))
      }else{
         await Post.findByIdAndDelete(postID);
         const currentUser= await User.findById(req.user.id);
         const userPostCount= currentUser?.posts-1;
         await User.findByIdAndUpdate(req.user.id,{posts:userPostCount});
         res.status(200).json(`post ${postID} deleted successfully`);
      }
      })
  }else{
    return next(new HttpError(" You Can't Delete Others Post"),400);
  }

  }catch (error) {
    return next(new HttpError(error))
}
};

module.exports = {createPost, getPost, editPost, deletePost, getCatPosts,getUserPosts,getPosts};