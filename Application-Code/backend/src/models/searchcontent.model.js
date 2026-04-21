import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const searchContentSchema = new mongoose.Schema({

    owner:{
        type: mongoose.Schema.Types.ObjectId, 
        ref:"User"
    },
    searchContent:{
         type: String
    }

},{timestamps:true});

searchContentSchema.plugin(mongooseAggregatePaginate);
 export const Searchcontent = mongoose.model("Searchcontent",searchContentSchema);