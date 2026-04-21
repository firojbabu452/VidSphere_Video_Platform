import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Searchcontent } from "../models/searchcontent.model.js";
import { response } from "express";





// const searchContent = asyncHandler(async (req, res) => {
//   const { searchContent: query } = req.params;
//   const userId = req.user?._id;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;

//   if (!query?.trim()) {
//     throw new ApiError(400, "Search query is required");
//   }

//   const trimmedQuery = query.trim();

//   // Save search history
//   const existingSearch = await Searchcontent.findOne({
//     owner: userId,
//     searchContent: trimmedQuery,
//   });

//   if (!existingSearch) {
//     await Searchcontent.create({
//       owner: userId,
//       searchContent: trimmedQuery,
//     });
//   }

 
//   const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//   const words = escapedQuery.split(/\s+/).filter(Boolean);

//   const wordRegexes = words.map(word => new RegExp(word, "i"));


//   const textScore = {
//     $meta: "textScore"
//   };

//   const channelMatchStage = words.length > 0
//     ? {
//         $match: {
//           $and: wordRegexes.map(regex => ({
//             $or: [
//               { username: regex },
//               { "fullname": regex } 
//             ]
//           }))
//         }
//       }
//     : { $match: {} };

//   const channelsAggregation = await User.aggregate([
//     channelMatchStage,
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers"
//       }
//     },
//     {
//       $addFields: {
//         subscribersCount: { $size: "$subscribers" },
//         isSubscribed: {
//           $cond: {
//             if: userId ? { $in: [userId, "$subscribers.subscriber"] } : false,
//             then: true,
//             else: false
//           }
//         },
//         type: { $literal: "channel" },
//         relevanceScore: {
//           $add: [
//             { $cond: [{ $regexMatch: { input: "$username", regex: `^${escapedQuery}`, options: "i" } }, 100, 0] },
//             { $cond: [{ $eq: ["$username", trimmedQuery] }, 200, 0] },
//             words.length > 1 ? 10 : 20 // multi-word slightly lower
//           ]
//         }
//       }
//     },
//     {
//       $project: {
//         username: 1,
//         fullName: 1,
//         avatar: 1,
//         subscribersCount: 1,
//         isSubscribed: 1,
//         type: 1,
//         relevanceScore: 1
//       }
//     },
//     { $sort: { relevanceScore: -1, subscribersCount: -1 } },
//     { $limit: 5 } 
//   ]);

//   // 2. Search Videos - with word-based matching
//   const videoAggregation = await Video.aggregate([
//     {
//       $match: {
//         isPublished: true,
//         $and: wordRegexes.map(regex => ({
//           $or: [
//             { title: regex },
//             { description: regex },
//             { tags: regex } 
//           ]
//         }))
//       }
//     },
  

//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "video",
//         as: "likes"
//       }
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "ownerDetails",
//         pipeline: [
//           { $project: { username: 1, avatar: 1 } }
//         ]
//       }
//     },
//     {
//       $addFields: {
//         likesCount: { $size: "$likes" },
//         owner: { $first: "$ownerDetails" },
//         type: { $literal: "video" },
//         relevanceScore: {
//           $add: [
//             // Exact title match = highest score
//             { $cond: [{ $regexMatch: { input: "$title", regex: `^${escapedQuery}$`, options: "i" } }, 300, 0] },
//             // Title starts with query
//             { $cond: [{ $regexMatch: { input: "$title", regex: `^${escapedQuery}`, options: "i" } }, 200, 0] },
//             // All words in title
//             {
//               $cond: [
//                 { $gt: [{ $size: { $setIntersection: [words.map(w => ({ $toLower: w })), { $map: { input: { $split: ["$title", " "] }, in: { $toLower: "$$this" } } }] } }, words.length - 1] },
//                 100, 50
//               ]
//             },
//             { $multiply: [{ $size: "$likes" }, 0.1] }, // slight boost for popular
//             { $divide: [1, { $add: [1, { $dateDiff: { startDate: "$createdAt", endDate: "$$NOW", unit: "day" } }] }] } // newer = better
//           ]
//         }
//       }
//     },
//     {
//       $project: {
//         thumbnail: 1,
//         title: 1,
//         description: 1,
//         duration: 1,
//         views: 1,
//         createdAt: 1,
//         likesCount: 1,
//         owner: {
//           username: 1,
//           avatar: 1,
//           subscribersCount: 1,
//           isSubscribed: 1
//         },
//         type: 1
//       }
//     },
//     { $sort: { relevanceScore: -1, createdAt: -1 } },
//     { $skip: (page - 1) * limit },
//     { $limit: limit + 5 } // extra for mixing
//   ]);


//   const combinedResults = [
//     ...channelsAggregation,
//     ...videoAggregation.slice(0, limit - channelsAggregation.length)
//   ];

//   const totalVideos = await Video.countDocuments({
//     isPublished: true,
//     $and: wordRegexes.map(regex => ({
//       $or: [
//         { title: regex },
//         { description: regex }
//       ]
//     }))
//   });

//   const hasMore = videoAggregation.length > limit - channelsAggregation.length + 5;

//   const result = {
//     pagination: {
//       page,
//       limit,
//       totalVideos: channelsAggregation.length + totalVideos,
//       totalPages: Math.ceil((channelsAggregation.length + totalVideos) / limit),
//       hasNextPage: page * limit < (channelsAggregation.length + totalVideos),
//       hasPrevPage: page > 1
//     },
//     data: combinedResults
//   };

//   return res
//     .status(200)
//     .json(new ApiResponse(200, result, "Search results fetched successfully"));
// });




const searchContent = asyncHandler(async (req, res) => {
  const { searchContent: query } = req.params;
  const userId = req.user?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (!query?.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  const trimmedQuery = query.trim();

  const existingSearch = await Searchcontent.findOne({
    owner: userId,
    searchContent: trimmedQuery,
  });

  if (!existingSearch) {
    await Searchcontent.create({
      owner: userId,
      searchContent: trimmedQuery,
    });
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const words = escapedQuery.split(/\s+/).filter(Boolean);
  const wordRegexes = words.map(word => new RegExp(word, "i"));

  let channelsAggregation = [];
  if (page === 1) {
    channelsAggregation = await User.aggregate([
      words.length > 0
        ? {
            $match: {
              $and: wordRegexes.map(regex => ({
                $or: [
                  { username: regex },
                  { fullname: regex }
                ]
              }))
            }
          }
        : { $match: {} },

      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          isSubscribed: userId
            ? { $in: [userId, "$subscribers.subscriber"] }
            : false,
          type: { $literal: "channel" },
          relevanceScore: {
            $add: [
              { $cond: [{ $regexMatch: { input: "$username", regex: `^${escapedQuery}`, options: "i" } }, 100, 0] },
              { $cond: [{ $eq: ["$username", trimmedQuery] }, 200, 0] },
              words.length > 1 ? 10 : 20
            ]
          }
        }
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribersCount: 1,
          isSubscribed: 1,
          type: 1,
          relevanceScore: 1
        }
      },
      { $sort: { relevanceScore: -1, subscribersCount: -1 } },
      { $limit: 5 }
    ]);
  }

  // === VIDEOS: Always fetch, but adjust skip/limit based on channels shown ===
  const videoSkip = page === 1 
    ? 0 
    : (page - 1) * limit;  // On page 1: no skip, on page 2+: normal pagination

  const videoLimit = page === 1
    ? limit - channelsAggregation.length + 10  // extra buffer for page 1
    : limit + 5; // extra for future pages

  const videoAggregation = await Video.aggregate([
    {
      $match: {
        isPublished: true,
        $and: wordRegexes.map(regex => ({
          $or: [
            { title: regex },
            { description: regex },
            { tags: regex }
          ]
        }))
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: {  username: 1, avatar: 1 } }]
      }
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $arrayElemAt: ["$ownerDetails", 0] },
        type: { $literal: "video" },
        relevanceScore: {
          $add: [
            { $cond: [{ $regexMatch: { input: "$title", regex: `^${escapedQuery}$`, options: "i" } }, 300, 0] },
            { $cond: [{ $regexMatch: { input: "$title", regex: `^${escapedQuery}`, options: "i" } }, 200, 0] },
            {
              $cond: [
                { $gt: [{ $size: { $setIntersection: [words.map(w => ({ $toLower: w })), { $map: { input: { $split: [{ $toLower: "$title" }, " "] }, in: "$$this" } }] } }, words.length - 1] },
                100, 50
              ]
            },
            { $multiply: [{ $size: "$likes" }, 0.1] },
            { $divide: [1, { $add: [1, { $dateDiff: { startDate: "$createdAt", endDate: "$$NOW", unit: "day" } }] }] }
          ]
        }
      }
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        likesCount: 1,
        owner: { _id:1, username: 1, avatar: 1 },
        type: 1
      }
    },
    { $sort: { relevanceScore: -1, createdAt: -1 } },
    { $skip: videoSkip },
    { $limit: videoLimit }
  ]);

  // === Combine Results ===
  let combinedResults = [];

  if (page === 1) {
    const videoSliceCount = limit - channelsAggregation.length;
    const videosForPage1 = videoAggregation.slice(0, videoSliceCount);
    combinedResults = [...channelsAggregation, ...videosForPage1];
  } else {
    combinedResults = videoAggregation.slice(0, limit); // only videos from page 2+
  }

  // === Total count for pagination (only videos after channels on page 1) ===
  const totalVideosMatched = await Video.countDocuments({
    isPublished: true,
    $and: wordRegexes.map(regex => ({
      $or: [
        { title: regex },
        { description: regex },
        { tags: regex }
      ]
    }))
  });

  const totalItems = (page === 1 ? channelsAggregation.length : 0) + totalVideosMatched;

  const result = {
    pagination: {
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPrevPage: page > 1
    },
    data: combinedResults
  };

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Search results fetched successfully"));
});




const searchData = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }

  const getdata = await Searchcontent.find({ owner: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSearch: getdata.length,  
        searches: getdata,            
      },
      "Search content fetched successfully"
    )
  );
});


const deleteserchdata = asyncHandler( async(req, res)=>{
      const userId = req.user?._id;
      if(!userId){
        throw new ApiError(400,"Unauthorized: User not authenticated");
      }

      const {searchId} = req.params;
      if(!searchId){
        throw new ApiError(400,"searchID is missing");
      }

       const serchDataDelete= await Searchcontent.findByIdAndDelete(searchId);
       if(!serchDataDelete){
        throw new ApiError(500,"failed to deleate search, Try again later!");
       }
       return res.status(201).json(
        new ApiResponse(200,{dataDelete:true},"search data delete successfully")
       )


})

export { searchContent, searchData, deleteserchdata };

