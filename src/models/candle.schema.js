import { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const candleSchema = new Schema(
    {
        index: {
            type: Number,
            required: true,
            min: 0,
        },

        open: {
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

        close: {
            type: Number,
            required: true,
        },

        value: {
            type: Number,
            default: 0,
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
    },
    {
        timestamps: true,
    }
);

candleSchema.plugin(mongoosePaginate)

export default candleSchema;