import mongoose from "mongoose";
import candleSchema from "./candle.schema";
import mongoosePaginate from "mongoose-paginate-v2";


candleSchema.plugin(mongoosePaginate);


const MinuteCandle =
    mongoose.models?.MinuteCandle ||
    mongoose.model(
        "MinuteCandle",
        candleSchema,
        "minute-candle"
    );

export default MinuteCandle;

