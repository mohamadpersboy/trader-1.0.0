import mongoose from "mongoose";
import obSchema from "@/models/ob.schema";


const ObModel =
    mongoose.models?.ObModel ||
    mongoose.model("ObModel", obSchema , "ob");


export default ObModel;