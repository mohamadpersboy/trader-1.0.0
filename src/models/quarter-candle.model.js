import mongoose from "mongoose";
import candleSchema from "./candle.schema";
import mongoosePaginate from "mongoose-paginate-v2";


candleSchema.plugin(mongoosePaginate);


const QuarterCandle =
    mongoose.models.QuarterCandle ||
    mongoose.model(
        "QuarterCandle",
        candleSchema,
        "quarter-Candle"
    );


export default QuarterCandle;