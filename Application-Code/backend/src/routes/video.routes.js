import { Router } from "express";
import {publishVideo, getVideoById, getMyVideos, getvideos, getVideosforDetailsPage, getLikeVideos} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.route("/").post(
    verifyJWT,
   upload.fields([
       {
        name:"videoFile",
        maxCount:1,
       },
       {
        name:"thumbnail",
        maxCount:1
       }
   ]),
   publishVideo
);
router.route("/v/:videoId").get(verifyJWT,getVideoById);
router.route("/uservideo/:channelId").get(verifyJWT,getMyVideos);
router.route("/getvideos").get(verifyJWT,getvideos);
router.route("/getVideosforDetailsPage/:videoId").get(verifyJWT,getVideosforDetailsPage);
router.route("/getLikeVideos").get(verifyJWT,getLikeVideos);

 


export default router;
