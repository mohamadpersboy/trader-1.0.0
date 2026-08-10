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
            required: false,
        },

        break: {
            type: timeSeriesDataSchema,
            required: false,
        },

        min: {
            type: timeSeriesDataSchema,
            required: false,
        },

        max: {
            type: timeSeriesDataSchema,
            required: false,
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