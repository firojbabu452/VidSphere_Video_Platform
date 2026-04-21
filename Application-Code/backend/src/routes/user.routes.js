import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentuser);
router.route("/update-account-details").patch(verifyJWT, updateAccountdetails);

router.route("/update-avtar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChanelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

router.route("/history/:videoId").delete(verifyJWT, deleteWatchHistory);
router.route("/clearhistory").delete(verifyJWT, deleteFullWatchHistory);

router.route("/getChanneldetails/:channelId").get(verifyJWT, getChanneldetails);



export default router;
