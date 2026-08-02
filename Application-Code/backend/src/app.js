


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import dotenv from "dotenv";
const app = express();
dotenv.config();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
}));
app.options("*", cors());
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


