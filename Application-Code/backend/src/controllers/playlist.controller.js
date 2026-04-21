import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async( req, res)=>{

    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400,"name and description both are required");
    }
  const userId = req.user?._id;
  if(!userId){
    throw new ApiError(400,"invalid userId");
  }

  const createPlaylist = await Playlist.create({
    name:name,
    description:description,
    owner:userId
  });

  if(!createPlaylist){
    throw new ApiError(500,"failed to create Playlist");
  }

  return res.status(201).json(
    new ApiResponse(200,createPlaylist,"playlist create successfully")
  )

});

const getPlaylist = asyncHandler(async (req, res)=>{
    const {channelId} = req.params;
       
    const userId= channelId;
    if(!userId){
        throw new ApiError(400,"invalid userId");
    };
    const playlists =  await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }

        },
        {

            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }

        },
        {
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                },
                totalViews:{
                    $sum:"$videos.views"
                }
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                videos: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

   if (!playlists || playlists.length === 0) {
        return res.status(201).json(
            new ApiResponse(200,playlists,"No playlists found")
        )
    }

    return res.status(201).json(
        new ApiResponse(200,playlists,"Playlists fetched successfully")
    )

});

const updatePlaylist = asyncHandler( async (req,res)=>{
    const {playlistsId} = req.params;
    if(!playlistsId){
        throw new ApiError(400,"playlistsId is required");
    }
   const {name,description } = req.body;
   if(!name || !description){
    throw new ApiError(400,"name and description both are required");
   }

   const playlist = await  Playlist.findById(playlistsId);
   if(!playlist){
    throw new ApiError(400,"Playlist not found");
   }

   const playlistUpdate = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
        $set:{
            name,
            description,
        }
    },
     { new:true }
   );
   if(!playlistUpdate){
    throw new ApiError(500,"playlist update failed");
   }

   return res.status(201).json(
     new ApiResponse(200,playlistUpdate,"Playlist update successfully")
   )

});

const deletePlaylist = asyncHandler(async (req,res)=>{
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(200,"playlist id is required");
    }

    const checkplaylist = await Playlist.findById(playlistId);
    if(!checkplaylist){
        throw new ApiError(400,"playlist not found");
    }

    const playlistDelete= await Playlist.findByIdAndDelete(checkplaylist._id);
    if(!playlistDelete){
        throw new ApiError(500,"faild to delete playlist")
    }
    
    return res.status(201).json(
        new ApiResponse(200,{},"playlist delete successully")
    )

});

const removeVideoFromPlaylist= asyncHandler(async (req, res)=>{
         
    const {playlistId,videoId}= req.params;
    if(!playlistId){
        throw new ApiError(400,"Playlist id not found");
    }
    if(!videoId){
        throw new ApiError(400,"video id not found")
    }

    const checkplaylist = await Playlist.findById(playlistId);
    if(!checkplaylist){
        throw new ApiError(400,"Playlist not found");
    }

    const removeVideo= await Playlist.findByIdAndUpdate(
        checkplaylist._id,
         {
            $pull:{videos: videoId}
         }
    );
    if(!removeVideo){
        throw new ApiError(500,"failed to remove video from playlist");
    }

    return res.status(201).json(
        new ApiResponse(200,{},"remove video from playlist")
    )

});

const getPlaylistForSave = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    // Validate videoId and userId
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not logged in");
    }

    let videoObjectId;
    try {
        videoObjectId = new mongoose.Types.ObjectId(videoId);
    } catch (error) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields: {
                isSaved: {
                    $in: [videoObjectId, "$videos"]  
                },
                totalVideos: { $size: { $ifNull: ["$videos", []] } } 
            }
        },
        {
            $project: {
                name: 1,
                totalVideos: 1,
                isSaved: 1,
                updatedAt: 1 // Needed for sorting
            }
        },
        {
            $sort: { updatedAt: -1 }
        }
    ]);

    // Fix: You had incorrect condition and status code
    if (playlists.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { playlists: [] }, "No playlists found for this user")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { playlists }, "Playlists fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler( async (req, res)=>{
  
    const {playlistId, videoId} = req.params;
    if(!playlistId){
        throw new ApiError(400,"Playlist is is require");
    }
    if(!videoId){
        throw new ApiError(400,"videoId not found");
    }

    const checkPlaylist = await Playlist.findById(playlistId);
    if(!checkPlaylist){
        throw new ApiError(400,"Playlist not found");
    }

    const addVideo= await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{videos:videoId}
        }
    );
    if(!addVideo){
        throw new ApiError(500,"Failed to add video on playlist");
    }

    return res.status(201).json(
        new ApiResponse(200,{},"video add successfull on playlist")
    )

});






export {createPlaylist, getPlaylist, updatePlaylist, deletePlaylist, removeVideoFromPlaylist, getPlaylistForSave, addVideoToPlaylist }