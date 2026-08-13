import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import QuarterCandle from "@/models/quarter-candle.model";

import detectFVG from "@/services/fvg/fvg.service";
import detectOB from "@/services/ob/ob.service";
import QuarterChoch from "@/models/quarter-choch.model";


export async function GET() {

    try {

        const bos ={
            "_id": "6a7e1d7eaafc8e6b5b864c8f",
            "index": 2442,
            "type": "bullish",
            "open": {
                "index": 778,
                "open": 1.153405,
                "high": 1.15371,
                "low": 1.153335,
                "close": 1.15347,
                "time": 1785420240,
                "formattedTime": "2026-07-30 17:34"
            },
            "update": null,
            "close": {
                "index": 2442,
                "open": 1.15364,
                "high": 1.153755,
                "low": 1.15357,
                "close": 1.15372,
                "time": 1785520560,
                "formattedTime": "2026-07-31 21:26"
            },
            "min": {
                "index": 2186,
                "open": 1.145845,
                "high": 1.146165,
                "low": 1.145505,
                "close": 1.14616,
                "time": 1785505200,
                "formattedTime": "2026-07-31 17:10"
            },
            "max": {
                "index": 778,
                "open": 1.153405,
                "high": 1.15371,
                "low": 1.153335,
                "close": 1.15347,
                "time": 1785420240,
                "formattedTime": "2026-07-30 17:34"
            },
            "percents50": 1.15011,
            "standard": true,
            "return": true,
            "isMatched": false,
            "startTime": 1785420240,
            "endTime": 1785520560,
            "createdAt": "2026-08-13T19:39:42.854Z",
            "updatedAt": "2026-08-13T19:39:42.854Z",
            "__v": 0,
            "fvgs": null,
            "obs": null,
            "id": "6a7e1d7eaafc8e6b5b864c8f"
        }

        await connectDB();

        //===============================================================
        // GET TEST CANDLES
        //===============================================================

        const candles = await QuarterCandle
            .find({
                time: {
                    $gte: bos.startTime,
                    $lte: bos.endTime,
                },
            })
            .sort({
                index: 1,
            })
            .limit(1000)
            .lean();

        const isMatched = await isLastChochSameAsBosType(bos);

        if (candles.length < 3) {

            return NextResponse.json({
                success: false,

                message: "Not enough quarter candles found.",
            }, {
                status: 400,
            });

        }


        //===============================================================
        // SIMULATED BOS
        //===============================================================

        // const bos = {
        //
        //     type: "bullish",
        //
        //     startTime: candles[0].time,
        //
        //     endTime: candles[candles.length - 1].time,
        //
        // };


        //===============================================================
        // DETECT FVG
        //===============================================================

        const fvgs = await detectFVG(bos);


        //===============================================================
        // DETECT OB
        //===============================================================

        const obs = await detectOB({
            ...bos, fvgs,
        });


        //===============================================================
        // RESPONSE
        //===============================================================

        return NextResponse.json({
            success: true,

            candlesCount: candles.length,

            startIndex: candles[0].index,

            endIndex: candles[candles.length - 1].index,

            bos,

            fvgCount: fvgs.length,

            fvgs,

            obCount: obs.length,

            obs,
        }, {
            status: 200,
        });


    } catch (error) {

        console.error("Error detecting FVG / OB:", error);


        return NextResponse.json({
            success: false,

            message: "Failed to detect FVG / OB",

            error: error.message,
        }, {
            status: 500,
        });

    }

}

async function isLastChochSameAsBosType(bos) {

    const { startTime, endTime, type } = bos;

    const result = await QuarterChoch.aggregate([
        {
            $project: {
                type: 1,

                chochs: [
                    "$bearishCh",
                    "$bullishCh",
                ],
            },
        },

        {
            $unwind: "$chochs",
        },

        {
            $match: {
                "chochs.time": {
                    $gt: startTime,
                    $lt: endTime,
                },
            },
        },

        {
            $sort: {
                "chochs.time": -1,
            },
        },

        {
            $limit: 1,
        },

        {
            $project: {
                _id: 0,
                type: 1,
                time: "$chochs.time",
            },
        },
    ]);

    console.log("Last CHOCH:", result[0].type === type);
}