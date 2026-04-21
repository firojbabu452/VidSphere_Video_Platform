import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Searchcontent } from "../models/searchcontent.model.js";
import { Like } from "../models/like.model.js";
import { response } from "express";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished, meta_tag } = req.body;
  if (!title) {
    throw new ApiError(400, "Video title is required");
  }
  if (!description) {
    throw new ApiError(400, "video description is required");
  }
  

  const videoFilePath = req.files?.videoFile[0].path;
  const thumbnailFilePath = req.files?.thumbnail[0].path;

  if (!videoFilePath) {
    throw new ApiError(400, "video file missing");
  }
  if (!thumbnailFilePath) {
    throw new ApiError(400, "Thumbnail is required filed");
  }

  const videoPath = await uploadOnCloudinary(videoFilePath);
 
  const thumbnailPath = await uploadOnCloudinary(thumbnailFilePath);

  if (!videoPath) {
    throw new ApiError(400, "video file not save in server, try again latter");
  }
  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail not save in server, try again latter");
  }

  //    const videoDuration = videoPath

  const video = await Video.create({
    title,
    description,
    isPublished,
    duration: videoPath.duration,
    videoFile: videoPath.url,
    thumbnail: thumbnailPath.url,
    owner: req.user?._id,
    metaTag:JSON.parse(meta_tag) 
  });

  const videoUpload = await Video.findById(video._id);
  if (!videoUpload) {
    throw new ApiError(500, "video Upload failed, try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video upload successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Invalid video id");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Invalid UserId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
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
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }
  // increament views if video fetch successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
  return res
    .status(201)
    .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const getMyVideos = asyncHandler(async (req, res) => {
  const {channelId} = req.params;
  const user_id = channelId;
  if (!user_id) {
    throw new ApiError(400, "Invalid user id");
  }

  const myVideoDetails = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(user_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likes",
              },
            },
          },
          {
            $project: {
              likesCount: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        videos: 1,
      },
    },
  ]);

  if (!myVideoDetails) {
    throw new ApiError(500, "video fetched failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, myVideoDetails[0], "video fetch successfully"));
});

const getvideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  if (!userId) {
    return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
  }
  const searchHistory = await Searchcontent.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 5, 
    },
    {
      $project: {
        searchContent: 1,
      },
    },
  ]);

  if (!searchHistory || searchHistory.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200,{message:"Try searching to get started"}, "Try searching to get started"));
  }


  const keywords = searchHistory
    .map((item) => item.searchContent.trim())
    .filter(Boolean);


  if (keywords.length === 0) {
    const fallbackVideos = await Video.aggregatePaginate(
      Video.aggregate([
        { $match: { isPublished: true } },
        { $sort: { createdAt: -1 } },
      ]),
      { page, limit }
    );
    return res.status(200).json(new ApiResponse(200,{message:"No valid keywords",fallbackVideos:fallbackVideos} , "No valid keywords"));
  }

  const orConditions = keywords.flatMap((keyword) => [
    { title: { $regex: keyword, $options: "i" } },
    { description: { $regex: keyword, $options: "i" } },
  ]);

  const aggregate = Video.aggregate([
    {
      $match: {
        isPublished: true,
        $or: orConditions,
      },
    },
    { $sort: { createdAt: -1 } }, 
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: { path: "$owner", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  const options = {
    page,
    limit,
    customLabels: {
      docs: "videos",
      totalDocs: "totalVideos",
    },
  };

  const result = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Personalized videos fetched successfully"));
});

const getVideosforDetailsPage = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Invalid Video ID");
  }


  const currentVideo = await Video.findById(videoId);
  
  if (!currentVideo) {
    throw new ApiError(404, "Video not found");
  }

  const metaTags = currentVideo.metaTag || [];
  if (metaTags.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { video: currentVideo, relatedVideos: [] }, "Video fetched, no related videos"));
  }

  
  const relatedVideos = await Video.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(videoId) }, 
        isPublished: true,
        metaTag: { $in: metaTags } 
      }
    },
    { $sort: { views: -1, createdAt: -1 } }, 
    { $limit: 12 }, 
    {
      $lookup: {
        from: "users", 
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    { $unwind: "$owner" }, 
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: 1
      }
    }
  ]);

  // Return both current video + related videos
  return res
    .status(200)
    .json(
      new ApiResponse(
        200, relatedVideos,"Video details and related videos fetched successfully"
    )
  );
});


const getLikeVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "UserId is required");
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
              views:1,
              ownerDetails: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        video: 1,
        likedBy: 1,
        details: "$videos"
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});





export { publishVideo, getVideoById, getMyVideos, getvideos, getVideosforDetailsPage, getLikeVideos };
