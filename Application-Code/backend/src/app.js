


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import dotenv from "dotenv";
const app = express();
dotenv.config();

app.use((req, res, next) => {
  console.log("CORS request origin:", req.headers.origin, "method:", req.method, "path:", req.path);
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.CORS_ORIGIN
    : true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
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
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});
app.use(errorHandler);
export {app};


