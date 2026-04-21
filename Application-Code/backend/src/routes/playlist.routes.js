import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createPlaylist, getPlaylist, updatePlaylist, deletePlaylist, removeVideoFromPlaylist,getPlaylistForSave, addVideoToPlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT, upload.none());
router.route("/createPlaylist").post(createPlaylist);
router.route("/getPlaylist/:channelId").get(getPlaylist);
router.route("/updatePlaylist/:playlistsId").patch(updatePlaylist);
router.route("/deletePlaylist/:playlistId").delete(deletePlaylist);
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").patch(removeVideoFromPlaylist);
router.route("/getPlaylistForSave/:videoId").get(getPlaylistForSave);
router.route("/addVideoToPlaylist/:playlistId/:videoId").post(addVideoToPlaylist);


export default router;