import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, getVideoComments, getAllComments,deleteComments, editComment } from "../controllers/comment.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();


router.use(verifyJWT, upload.none()); 
router.route("/getAllComments").get(getAllComments);
router.route("/editComment/:commentId").patch(editComment);
router.route("/deleteComments/:commentId").delete(deleteComments);



router.route("/:videoId").post(addComment);
router.route("/:videoId").get(getVideoComments);



export default router;