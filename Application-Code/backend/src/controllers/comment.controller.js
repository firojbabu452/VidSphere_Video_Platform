import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "invalid Video id");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "comment is required");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });
  if (!comment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }

  res
    .status(201)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video file not get from url");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let totalComments = await Comment.countDocuments({ video: videoId });
  if (!totalComments) {
    throw new ApiError(500, "faled to fetch total comments");
  }

  const commentsAggregate = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
        isLiked: 1,
      },
    },
  ]);

  if (!commentsAggregate) {
    throw new ApiError(500, "failed to fetch comments details");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        {  totalComments: totalComments, comments: commentsAggregate },
        "Comments fetched successfully"
      )
    );
});

const getAllComments = asyncHandler(async (req, res)=>{
  const userId = req.user?._id;
  if(!userId){
    throw new ApiError(400,"User Id not found");
  }

  const allcomments = await Comment.aggregate([
    {
      $match:{
        owner: new mongoose.Types.ObjectId(userId),
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"video",
        foreignField:"_id",
        as:"videoDetails",
        pipeline:[
          {
            $project:{
              _id:1,
              thumbnail:1,
              title:1,
              duration:1,
              views:1
            }
          }
        ]
      }
    },
    {
      $project:{
          _id:1,
          content:1,
          videoDetails:1
      }
    }
  ]);

  const totalComments = allcomments.length;


  return res.status(201).json(
    new ApiResponse(200,{allcomments,totalComments},"all comments fetch successfully")
  )

});


const deleteComments = asyncHandler(async (req, res)=>{

  const {commentId} = req.params;
  if(!commentId){
    throw new ApiError(400,"commentId id is missing");
  }
  const userId= req.user?._id;
  if(!userId){
    throw new ApiError(400,"UserId id missing");
  }

  const deleteComments = await Comment.findByIdAndDelete(commentId);
  if(!deleteComments){
    throw new ApiError(500,"Delete faild, please try again leater!.");
  }

  return res.status(201).json(
    new ApiResponse(200,{deleteComments:true},"comment delete successfully")
  )
});

const editComment= asyncHandler(async (req, res)=>{
  const {commentId} = req.params;
  if(!commentId){
    throw new ApiError(400,"comment id not found");
  }

  const {content} = req.body;
  if(!content){
    throw new ApiError(400,"connet missing");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },  
     { new: true }  
 );
  if(!updateComment){
    throw new ApiError(500,"comment Update failed, please try again latter");
  }
 return res.status(200).json(
    new ApiResponse(200, updateComment, "Comment updated successfully")
  );

});




export { addComment, getVideoComments, getAllComments, deleteComments, editComment };
