// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// const app=express();

// app.use(cors({
//     origin:process.env.CORS_ORIGIN,
//     credentials:true
// }));

// app.use(express.json({
//     limit:"16kb"
// }));

// app.use(express.urlencoded({
//     extended:true,
//     limit:"16kb"
// }));

// app.use(express.static("public"));
// app.use(cookieParser());

// export {app};


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import dotenv from "dotenv";
const app = express();
dotenv.config();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(cookieParser());

app.use(express.json({
    limit:"16kb"
}));

app.use(express.urlencoded({
       extended: true,
       limit:"16kb"
}));
app.use(express.static("public"));

// routes import 
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter  from "./routes/subscription.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import searchcontentRouter from "./routes/searchcontent.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
// routes declaration
app.use("/api/v1/user",userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/search", searchcontentRouter);
app.use("/api/v1/playlist", playlistRouter);

app.use(errorHandler);
export {app};


