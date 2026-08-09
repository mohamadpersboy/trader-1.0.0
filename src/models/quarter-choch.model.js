import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import chochSchema from "./choch.schema";


chochSchema.plugin(mongoosePaginate);


const QuarterChoch =
    mongoose.models?.QuarterChoch ||
    mongoose.model(
        "QuarterChoch",
        chochSchema,
        "quarter_chochs"
    );


export default QuarterChoch;