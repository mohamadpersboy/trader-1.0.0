import mongoose, { Schema } from "mongoose";


const configSchema = new Schema(
    {
        lastMinuteCandleIndex: {
            type: Number,
            default: 0,
        },

        lastQuarterCandleIndex: {
            type: Number,
            default: 0,
        },

        lastMinuteChochCheckIndex: {
            type: Number,
            default: 0,
        },

        lastQuarterChochCheckIndex: {
            type: Number,
            default: 0,
        },

        lastBosCheckIndex: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: "configs",
    }
);


const Config =
    mongoose.models?.Config ||
    mongoose.model(
        "Config",
        configSchema
    );


export default Config;