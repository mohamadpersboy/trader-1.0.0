import { Schema } from "mongoose";


const timeSeriesDataSchema = new Schema(
    {
        index: {
            type: Number,
            required: true,
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
        _id: false,
    }
);


const bosSchema = new Schema(
    {
        index: {
            type: Number,
            required: true,
            index: true,
        },

        type: {
            type: String,
            required: true,
            index: true,
        },

        open: {
            type: timeSeriesDataSchema,
            required: true,
        },

        update: {
            type: timeSeriesDataSchema,
            required: false,
        },

        close: {
            type: timeSeriesDataSchema,
            required: true,
        },

        min: {
            type: timeSeriesDataSchema,
            required: false,
        },

        max: {
            type: timeSeriesDataSchema,
            required: false,
        },

        percents50: {
            type: Number,
            default: 0,
        },

        standard: {
            type: Boolean,
            default: true,
        },

        return: {
            type: Boolean,
            default: false,
        },

        isMatched: {
            type: Boolean,
            default: false,
        },

        startTime: {
            type: Number,
            required: true,
            index: true,
        },

        endTime: {
            type: Number,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,

        toJSON: {
            virtuals: true,
        },

        toObject: {
            virtuals: true,
        },
    }
);


bosSchema.virtual("fvgs", {
    ref: "Fvg",
    localField: "_id",
    foreignField: "bosId",
    justOne: true,
});


export default bosSchema;