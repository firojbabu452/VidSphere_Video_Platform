

import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler( async (req,res)=>{
  
       const { videoId } = req.params;

       if(!videoId){
          throw new ApiError(400,"invalid video id");
       }

       const likedAlready = await Like.findOne({
        video:videoId,
        likedBy: req.user?._id
       });
       if(likedAlready){
        await Like.findByIdAndDelete(likedAlready._id);
        
        return res.status(201).json(
            new ApiResponse(200,{isLiked:false},"video Unlike Successfull")
        )
       }

       await Like.create({
        video:videoId,
        likedBy:req.user?._id
       });

       return res.status(201).json(
        new ApiResponse(200,{isLiked:true},"Video like successfully")
       )

});

const toggleCommentLike = asyncHandler(async (req,res)=>{
        const {commentId } = req.params;
         if(!commentId){
            throw new ApiError(400,"Invalid comment id");
         }
          
        const checklike = await Like.findOne({
            comment:commentId,
            likedBy: req.user?._id
         });
         
         if(checklike){
            await Like.findByIdAndDelete(checklike._id);
            return res.status(201).json(
                new ApiResponse(200,{isLiked:false},"comment unlike sucessfully")
            )
         }

    await Like.create({
        comment:commentId,
         likedBy: req.user?._id
    });

    return res.status(201).json(
        new ApiResponse(200,{isLiked:true},"comment like successfully")
    )

});


export {toggleVideoLike,toggleCommentLike};