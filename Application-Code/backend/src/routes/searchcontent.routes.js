
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {searchContent ,searchData, deleteserchdata} from "../controllers/searchcontent.controller.js";

const router = Router();
router.use(verifyJWT);


router.route("/searchContentData").get(searchData);
router.route("/s/:searchContent").get(searchContent);
router.route("/searchId/:searchId").delete(deleteserchdata);

export default router;