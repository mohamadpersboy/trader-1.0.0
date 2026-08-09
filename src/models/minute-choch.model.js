import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import chochSchema from "./choch.schema";


chochSchema.plugin(mongoosePaginate);


const MinuteChoch =
    mongoose.models?.MinuteChoch ||
    mongoose.model(
        "MinuteChoch",
        chochSchema,
        "minute_chochs"
    );


export default MinuteChoch;