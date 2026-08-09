import mongoose from "mongoose";

import tempChochSchema from "./temp-choch.schema";


const TempMinuteChoch =
    mongoose.models?.TempMinuteChoch ||
    mongoose.model(
        "TempMinuteChoch",
        tempChochSchema,
        "temp_minute_chochs"
    );


export default TempMinuteChoch;