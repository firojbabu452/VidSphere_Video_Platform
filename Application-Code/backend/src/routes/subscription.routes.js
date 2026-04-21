import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {toggleSubscription, getSubscribedChannel} from "../controllers/subscription.controller.js";
const router =Router();

router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription);
router.route("/getSubscribedChannel").get(getSubscribedChannel);



export default router;