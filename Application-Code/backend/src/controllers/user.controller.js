import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const genarateAccessAndRefreshTokens = async (userId) => {
  try {
    // console.log("userId" + userId);
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    //  console.log("accessToken" + accessToken);
    const refreshToken = user.generateRefreshToken();
    // console.log("refreshToken" + refreshToken);

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genarating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // step for user Registration
  // 1: get user details from fontend
  // 2: validation - not empty
  // 3: check if user aleary exist or not : username:email
  // 4: check for images,check for avtar
  // 5: upload them to cloudinary, avtar
  // 6: create user object - creater entry db
  // 7: remove password and refresh token filed from responsc
  // 8: check for user creation
  // 9: return responsc

  const { username, email, fullname, password } = req.body;
  // console.log("fullname:" + fullname);
  // console.log("email:" + email);
  // console.log("username:" + username);
  // console.log("password:" + password);

  if (fullname === "") {
    throw new ApiError(400, "full name is required");
  }
  if (email === "") {
    throw new ApiError(400, "Email is required");
  }
  if (username === "") {
    throw new ApiError(400, "User name is required");
  }
  if (password === "") {
    throw new ApiError(400, "Password is required");
  }

  // User.findOne({  // only check email,
  //   email
  // })

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User Alredy Register");
  }
  // console.log("hi");
  const avatarLocalPath = req.files?.avatar[0].path;
  // console.log("close");
  // console.log("avatarLocalPath" + avatarLocalPath);

  // const coverImageLocalPath= req.files?.coverImage[0].path;
  // console.log("coverImageLocalPath" + coverImageLocalPath);

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Some wend wrong wheile register user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registerd Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // 1: get data from request body
  // 2: username or email
  // 3: find user form database
  // 4: password check
  // 5: genarate access token and refresh token
  // 6: send cookie token
  // 7: send responsc
  

  const { email, username, password } = req.body;
  

  if (!username && !email) {
    throw new ApiError(400, "Username or Email required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await genarateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none", 
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    //  console.log("incomingRefreshToken" + incomingRefreshToken);
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await genarateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountdetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname && !email) {
    throw new ApiError(400, "All fildes are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avater file is missing");
    };
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar");
    };
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar update successfully"));

});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    console.log("coverImageLocalPath" + coverImageLocalPath);
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    };

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log("coverImage" + coverImage);
    if (!coverImage) {
        throw new ApiError(400, "Error while uploading cover image");
    };
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image update successfully"));

});

const getUserChanelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    };
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubcribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubcribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ]);
    //console.log(channel);
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    };
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "UserChanel fetch successfully"))

});

// const getWatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.aggregate([
//         // Match the current user
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(req.user._id)
//             }
//         },
//         // Populate watchHistory → videos → owner (with selected fields)
//         {
//             $lookup: {
//                 from: "videos",
//                 localField: "watchHistory",
//                 foreignField: "_id",
//                 as: "watchHistory",
//                 pipeline: [
//                     {
//                         $lookup: {
//                             from: "users",
//                             localField: "owner",
//                             foreignField: "_id",
//                             as: "owner",
//                             pipeline: [
//                                 {
//                                     $project: {
//                                         fullname: 1,
//                                         username: 1,
//                                         avatar: 1
//                                     }
//                                 }
//                             ]
//                         }
//                     },
//                     {
//                         $addFields: {
//                             owner: { $first: "$owner" }   // convert owner array → object
//                         }
//                     }
//                 ]
//             }
//         },
//         // Final projection – only send what the frontend needs
//         {
//             $project: {
//                 _id: 0,                     // hide user _id if you don't want to expose it
//                 watchHistory: {
//                     _id: 1,
//                     videoFile: 1,
//                     thumbnail: 1,
//                     title: 1,
//                     description: 1,
//                     duration: 1,
//                     views: 1,
//                     isPublished: 1,
//                     createdAt: 1,
//                     owner: {
//                         _id: 1,
//                         username: 1,
//                         fullname: 1,
//                         avatar: 1
//                     }
//                 }
//             }
//         }
//     ]);

//     // user is an array with one document → grab it with user[0]
//     if (!user.length || !user[0].watchHistory) {
//         return res
//             .status(200)
//             .json(new ApiResponse(200, [], "Watch history fetched successfully"));
//     }

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 user[0].watchHistory,                 // send only the array of videos
//                 "Watch history fetched successfully"
//             )
//         );
// });


const getWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10)); // optional: cap limit
    const skip = (page - 1) * limit;

     const result = await User.aggregate([
        // Match the current user
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        // Lookup videos in watchHistory
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistoryVideos",
                pipeline: [
                    // Join owner details
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { fullname: 1, username: 1, avatar: 1 } }
                            ]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } },

                    // Optional: Only include published videos (recommended)
                    { $match: { isPublished: true } },

                    // Project only needed fields
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
                            owner: {
                                _id: 1,
                                username: 1,
                                fullname: 1,
                                avatar: 1
                            }
                        }
                    }
                ]
            }
        },

        // Replace watchHistory with populated videos
        {
            $addFields: {
                watchHistoryVideos: {
                    $slice: ["$watchHistoryVideos", skip, limit]  // This is the pagination!
                }
            }
        },

        // Final projection
        {
            $project: {
                _id: 0,
                watchHistory: "$watchHistoryVideos",
                totalVideos: { $size: "$watchHistory" }, // original watchHistory length for total count
                currentPage: { $literal: page },
                totalPages: {
                    $ceil: { $divide: [{ $size: "$watchHistory" }, limit] }
                }
            }
        }
       ]);

       // result is array with one document
       const data = result[0] || { watchHistory: [], totalVideos: 0 };

      return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: data.watchHistory || [],
                pagination: {
                    currentPage: page,
                    totalPages: data.totalPages || 0,
                    totalVideos: data.totalVideos || 0,
                    hasNextPage: page < (data.totalPages || 0),
                    hasPrevPage: page > 1
                }
            },
            "Watch history fetched successfully"
        )
    );
});


const deleteWatchHistory = asyncHandler( async (req, res)=>{

  const {videoId} = req.params;
  if(!videoId){
    throw new ApiError(400,"Video id is required");
  }
  if(!req.user?._id){
    throw new ApiError(400,"invalid user credentials");
  }


  const removeFromWatchHistory = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull:{watchHistory:videoId}
    },
  )

  if(!removeFromWatchHistory){
    throw new ApiError(500,"Failed to remove from  watchhistory");
  }

  return res.status(201).json(
    new ApiResponse(200,{},"Remove from watch history")
  )

});

const deleteFullWatchHistory = asyncHandler( async (req, res)=>{

     if(!req.user?._id){
      throw new ApiError(400,"Invalid User Id")
    }

    const deleteHistory= await User.findByIdAndUpdate(
      req.user?._id,
      {$set:{watchHistory:[]}}
      
    )

    if(!deleteHistory){
      throw new ApiError(400,"Failed to clear watch history");
    }

    return res.status(201).json(
      new ApiResponse(200,{},"Clear watch history")
    )


  });

const getChanneldetails= asyncHandler(async (req,res)=>{
   const {channelId} = req.params;
   if(!channelId){
    throw new ApiError(400,"invalid channel id");
   }
     
   const channelDetails= await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $addFields:{
         subscribersCount:{
          $size:"$subscribers"
         },
         isSubcribed:{
          $cond:{
            if:{
              $in:[req.user?._id,"$subscribers.subscriber"],
            },
            then:true,
            else:false
          }
         }
      }
    },
    {
      $project:{
           _id:1,
           username:1,
           avatar:1,
           coverImage:1,
           subscribersCount:1,
           isSubcribed:1,
      }
    }
   
   ]);

   if(!channelDetails){
    throw new ApiError(500,"failed to fetch channel details");
   }

   return res.status(201).json(
    new ApiResponse(200,channelDetails[0],"channel details fetch successfully")
   )
   




})  


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentuser,
  updateAccountdetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChanelProfile,
  getWatchHistory,
  deleteWatchHistory,
  deleteFullWatchHistory,
  getChanneldetails
};


     
