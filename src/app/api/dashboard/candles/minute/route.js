import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import {cursorPaginate} from "@/lib/cursor-pagination";

import MinuteCandle from "@/models/minute-candle.model";
import MinuteChoch from "@/models/minute-choch.model";
import TempMinuteChoch from "@/models/temp-minute-choch.model";
import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";
import Fvg from "@/models/fvg.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                        FETCH MINUTE CANDLES                          //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        const result = await cursorPaginate(MinuteCandle, {

            cursor: searchParams.get("cursor"),

            direction: searchParams.get("direction") === "prev" ? "prev" : "next",

            limit: searchParams.get("limit"),

        });


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching minute candles (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch minute candles",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//               CLEAR MINUTE CANDLES (+ EVERYTHING DERIVED)            //
//-----------------------------------------------------------------------//
//  زنجیره‌ی وابستگی: MinuteCandle -> MinuteChoch -> Bos -> Fvg            //
//  پاک کردن کندل‌ها بدون پاک کردن نتایجی که از روشون ساخته شدن، رفرنس‌های //
//  یتیم و بی‌معنی به‌جا می‌ذاره - پس کل زنجیره رو با هم پاک می‌کنیم.       //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const [
            deletedCandles,
            deletedChoch,
            deletedTempChoch,
            deletedBos,
            deletedTempBos,
            deletedFvg,
        ] = await Promise.all([

            MinuteCandle.deleteMany({}),

            MinuteChoch.deleteMany({}),

            TempMinuteChoch.deleteMany({}),

            Bos.deleteMany({}),

            TempBos.deleteMany({}),

            Fvg.deleteMany({}),

        ]);


        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({});

        } else {

            config.lastMinuteCandleIndex = 0;
            config.lastMinuteChochCheckIndex = 0;
            config.lastBosCheckIndex = 0;

            await config.save();

        }


        return NextResponse.json({

            success: true,

            message: "Minute candles and everything derived from them (CHOCH, BOS, FVG) were cleared.",

            deleted: {

                "minute-candles": deletedCandles.deletedCount ?? 0,

                "minute-choch": deletedChoch.deletedCount ?? 0,

                "temp-minute-choch": deletedTempChoch.deletedCount ?? 0,

                bos: deletedBos.deletedCount ?? 0,

                "temp-bos": deletedTempBos.deletedCount ?? 0,

                fvg: deletedFvg.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error clearing minute candles:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear minute candles",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
