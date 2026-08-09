import mongoose from "mongoose";

import tempChochSchema from "./temp-choch.schema";


const TempQuarterChoch =
    mongoose.models?.TempQuarterChoch ||
    mongoose.model(
        "TempQuarterChoch",
        tempChochSchema,
        "temp_quarter_chochs"
    );


export default TempQuarterChoch;