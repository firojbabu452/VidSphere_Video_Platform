import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log("process.env.CLOUDINARY_CLOUD_NAME " + process.env.CLOUDINARY_CLOUD_NAME);
// console.log("process.env.CLOUDINARY_API_KEY " + process.env.CLOUDINARY_API_KEY);
// console.log("process.env.CLOUDINARY_API_SECRET " + process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary = async (localFilePath) =>{
      console.log("cloudniary page localFilePath:" + localFilePath);
      try {
        if(!localFilePath) return null;
        // upload file on cloudinary
        const responsc= await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
         console.log("file upload successfully" + responsc.url);
          fs.unlinkSync(localFilePath);
         return responsc;
        
      } catch (error) {
         fs.unlinkSync(localFilePath); // remove the locally save tlocalFilePathemporary file as the upoad oparation failed
         return null;
      }
    }

    export {uploadOnCloudinary};

// const uploadOnCloudinary = async (localFilePath) => {
//     console.log("cloudniary page localFilePath:" + localFilePath);
//     try {
//         if (!localFilePath) return null;
//         // upload file on cloudinary
//         const responsc = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         });
//        // console.log("file upload successfully" + responsc.url);
//         fs.unlinkSync(localFilePath);
//         return responsc;
//     } 
//     catch (error) {
//        fs.unlinkSync(localFilePath); // remove the locally save tlocalFilePathemporary file as the upoad oparation failed
//         return null;
//     }
// }

// export {uploadOnCloudinary};


