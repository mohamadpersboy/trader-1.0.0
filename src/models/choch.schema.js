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


const chochSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            index: true,
        },

        base: {
            type: timeSeriesDataSchema,
            required: true,
        },

        break: {
            type: timeSeriesDataSchema,
            required: true,
        },

        min: {
            type: timeSeriesDataSchema,
            required: true,
        },

        max: {
            type: timeSeriesDataSchema,
            required: true,
        },

        bullishCh: {
            type: timeSeriesDataSchema,
            required: false,
        },

        bearishCh: {
            type: timeSeriesDataSchema,
            required: false,
        },

        breakMin: {
            type: Boolean,
            default: false,
        },

        breakMax: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);


export default chochSchema;