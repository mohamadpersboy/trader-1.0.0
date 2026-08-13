import { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// ============================================================
// TIME SERIES DATA
// ============================================================

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

// ============================================================
// OB ITEM
// ============================================================

const obItemSchema = new Schema(
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

        base: {
            type: timeSeriesDataSchema,
            default: null,
        },

        update: {
            type: timeSeriesDataSchema,
            default: null,
        },

        break: {
            type: timeSeriesDataSchema,
            default: null,
        },

        top: {
            type: Number,
            default: 0,
        },

        bottom: {
            type: Number,
            default: 0,
        },

        use: {
            type: Boolean,
            default: false,
        },

        fvg: {
            type: Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        _id: true,
    }
);

// ============================================================
// OB
// ============================================================

const obSchema = new Schema(
    {
        bosId: {
            type: Schema.Types.ObjectId,
            ref: "Bos",
            required: true,
            unique: true,
            index: true,
        },

        obs: {
            type: [obItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

obSchema.plugin(mongoosePaginate);

export default obSchema;