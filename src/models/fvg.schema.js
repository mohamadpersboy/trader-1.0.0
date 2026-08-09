import { Schema } from "mongoose";

const fvgItemSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["bullish", "bearish"],
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
    }
);

export default fvgSchema;