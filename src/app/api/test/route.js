import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import QuarterCandle from "@/models/quarter-candle.model";

import detectFVG from "@/services/fvg/fvg.service";
import detectOB from "@/services/ob/ob.service";


export async function GET() {

    try {

        await connectDB();

        //===============================================================
        // GET TEST CANDLES
        //===============================================================

        const candles = await QuarterCandle
            .find()
            .sort({
                index: 1,
            })
            .limit(1000)
            .lean();


        if (candles.length < 3) {

            return NextResponse.json(
                {
                    success: false,

                    message: "Not enough quarter candles found.",
                },
                {
                    status: 400,
                }
            );

        }


        //===============================================================
        // SIMULATED BOS
        //===============================================================

        const bos = {

            type: "bullish",

            startTime: candles[0].time,

            endTime: candles[candles.length - 1].time,

        };


        //===============================================================
        // DETECT FVG
        //===============================================================

        const fvgs = await detectFVG(bos);


        //===============================================================
        // DETECT OB
        //===============================================================

        const obs = await detectOB({
            ...bos,
            fvgs,
        });


        //===============================================================
        // RESPONSE
        //===============================================================

        return NextResponse.json(
            {
                success: true,

                candlesCount: candles.length,

                startIndex: candles[0].index,

                endIndex: candles[candles.length - 1].index,

                bos,

                fvgCount: fvgs.length,

                fvgs,

                obCount: obs.length,

                obs,
            },
            {
                status: 200,
            }
        );


    } catch (error) {

        console.error(
            "Error detecting FVG / OB:",
            error
        );


        return NextResponse.json(
            {
                success: false,

                message: "Failed to detect FVG / OB",

                error: error.message,
            },
            {
                status: 500,
            }
        );

    }

}