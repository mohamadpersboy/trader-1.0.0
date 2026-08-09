import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import bosSchema from "./bos.schema";


bosSchema.plugin(mongoosePaginate);


const Bos =
    mongoose.models?.Bos ||
    mongoose.model(
        "Bos",
        bosSchema,
        "bos"
    );


export default Bos;