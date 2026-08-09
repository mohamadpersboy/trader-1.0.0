import mongoose from "mongoose";

import tempBosSchema from "./temp-bos.schema";


const TempBos =
    mongoose.models?.TempBos ||
    mongoose.model(
        "TempBos",
        tempBosSchema,
        "temp_bos"
    );


export default TempBos;