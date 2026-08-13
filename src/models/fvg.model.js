import mongoose from "mongoose";
import fvgSchema from "@/models/fvg.schema";


const Fvg =
    mongoose.models?.Fvg ||
    mongoose.model("Fvg", fvgSchema , "fvg");


export default Fvg;