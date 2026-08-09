import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const fvgItemSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
        },

        index: {
            type: Number,
            required: true,
        },

        high: {
            type: Number,
            required: true,
        },

        low: {
            type: Number,
            required: true,
        },

        time: {
            type: Number,
            required: true,
            index: true,
        },

        formattedTime: {
            type: String,
            required: true,
        },

        use: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: true,
    }
);


const fvgSchema = new Schema(
    {
        bosId: {
            type: Schema.Types.ObjectId,
            ref: "Bos",
            required: true,
            unique: true,
            index: true,
        },

        fvgs: {
            type: [fvgItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: "fvgs",
    }
);


fvgSchema.plugin(mongoosePaginate);


const Fvg =
    mongoose.models?.Fvg ||
    mongoose.model("Fvg", fvgSchema , "fvg");


export default Fvg;