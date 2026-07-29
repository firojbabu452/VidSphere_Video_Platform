

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












