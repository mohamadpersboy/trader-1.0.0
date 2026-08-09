import {Schema} from "mongoose";


//=======================================================================//
//                         TIME SERIES DATA                              //
//=======================================================================//

const timeSeriesDataSchema = new Schema({

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

}, {
    _id: false,
});


//=======================================================================//
//                            TEMP BOS                                   //
//=======================================================================//

const tempBosSchema = new Schema({

    name: {
        type: String,
        required: true,
        enum: ["bearishBOS", "bullishBOS"],
        index: true,
    },

    type: {
        type: String,
        required: true,
        index: true,
    },

    open: timeSeriesDataSchema,

    update: timeSeriesDataSchema,

    close: timeSeriesDataSchema,

    min: timeSeriesDataSchema,

    max: timeSeriesDataSchema,

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
        index: true,
    },

    endTime: {
        type: Number,
        index: true,
    },

}, {
    timestamps: true,
});


export default tempBosSchema;