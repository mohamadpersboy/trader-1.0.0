import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import {cursorPaginate} from "@/lib/cursor-pagination";

import QuarterCandle from "@/models/quarter-candle.model";
import QuarterChoch from "@/models/quarter-choch.model";
import TempQuarterChoch from "@/models/temp-quarter-choch.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                       FETCH QUARTER CANDLES                          //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        const result = await cursorPaginate(QuarterCandle, {

            cursor: searchParams.get("cursor"),

            direction: searchParams.get("direction") === "prev" ? "prev" : "next",

            limit: searchParams.get("limit"),

        });


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching quarter candles (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch quarter candles",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//              CLEAR QUARTER CANDLES (+ QUARTER CHOCH)                  //
//-----------------------------------------------------------------------//
//  زنجیره‌ی وابستگی: QuarterCandle -> QuarterChoch (BOS به quarter choch  //
//  وابسته نیست، فقط minute choch؛ پس زنجیره‌ی quarter کوتاه‌تره)          //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const [
            deletedCandles,
            deletedChoch,
            deletedTempChoch,
        ] = await Promise.all([

            QuarterCandle.deleteMany({}),

            QuarterChoch.deleteMany({}),

            TempQuarterChoch.deleteMany({}),

        ]);


        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({});

        } else {

            config.lastQuarterCandleIndex = 0;
            config.lastQuarterChochCheckIndex = 0;

            await config.save();

        }


        return NextResponse.json({

            success: true,

            message: "Quarter candles and derived quarter CHOCH were cleared.",

            deleted: {

                "quarter-candles": deletedCandles.deletedCount ?? 0,

                "quarter-choch": deletedChoch.deletedCount ?? 0,

                "temp-quarter-choch": deletedTempChoch.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error clearing quarter candles:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear quarter candles",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
