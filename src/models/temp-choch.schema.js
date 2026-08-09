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


const tempChochSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            enum: ["primary", "secondary"],
            index: true,
        },

        type: {
            type: String,
            required: false,
            index: true,
        },

        base: {
            type: timeSeriesDataSchema,
            default: null,
        },

        break: {
            type: timeSeriesDataSchema,
            default: null,
        },

        min: {
            type: timeSeriesDataSchema,
            default: null,
        },

        max: {
            type: timeSeriesDataSchema,
            default: null,
        },

        bullishCh: {
            type: timeSeriesDataSchema,
            default: null,
        },

        bearishCh: {
            type: timeSeriesDataSchema,
            default: null,
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


export default tempChochSchema;