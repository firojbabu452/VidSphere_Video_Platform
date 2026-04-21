import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  // Check if the user is already subscribed to this channel
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  let subscribed = false;
  let message = "";

  if (isSubscribed) {
    // Unsubscribe
    await Subscription.findByIdAndDelete(isSubscribed._id);
    subscribed = false;
    message = "Unsubscribed successfully";
  } else {
    // Subscribe
    await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
    subscribed = true;
    message = "Subscribed successfully";
  }

  // Get total subscribers count for the channel
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribed,
        totalSubscribers,
      },
      message
    )
  );
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "userId missing");
  }

  const SubscribedChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId)
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos"
            }
          },
          {
            $addFields: {
              totalVideos: { $size: "$videos" }
            }
          },
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subs"
            }
          },
          {
            $addFields: {
              totalSubscribers: { $size: "$subs" }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              totalVideos: 1,
              totalSubscribers: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 0,
        channel: 1,
        channelDetails: 1
      }
    }
  ]);

  const totalSubscribed = SubscribedChannel.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
         {
          totalSubscribed,
          channels: SubscribedChannel
         },
        "Subscribed data fetch successfully"
      )
    );
});


export { toggleSubscription, getSubscribedChannel };
