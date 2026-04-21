// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import { app } from "./app.js";
// dotenv.config();


// connectDB().then(()=>{
// app.listen(process.env.PORT,()=>{
//    console.log("Serever running on port:" + process.env.PORT);
// });
// }).catch((err)=>{
//     console.log("DB connection error !!", err);
// });

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();

connectDB().then(()=>{
  app.listen(process.env.PORT,()=>{
     console.log("Serever running on port:" + process.env.PORT);
  });
}).catch((err)=>{
      console.log("DB connection failed !!" + err);
});































// import mongoose from "mongoose";
// import {DB_NAME} from "./constants.js";
// import express from "express";
// import dotenv from "dotenv";
// dotenv.config();
// const app=express();

// console.log(`${process.env.MONGODB_URL}/${DB_NAME}`);
// ;(async ()=>{
//      try {
//      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//      app.on("error",(error)=>{
//           console.log("Error: " + error);
         
//      });
//      console.log("Db connection successfully");

//      app.listen(process.env.PORT,()=>{
//            console.log("port running to 8000");
//      })
        
//      } catch (error) {
//          console.error("Error: " + error);
         
//      }
// })();
