import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import MinuteCandle from "@/models/minute-candle.model";
import QuarterCandle from "@/models/quarter-candle.model";
import MinuteChoch from "@/models/minute-choch.model";
import QuarterChoch from "@/models/quarter-choch.model";
import Bos from "@/models/bos.model";
import Fvg from "@/models/fvg.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                        DASHBOARD OVERVIEW STATS                       //
//=======================================================================//

export async function GET() {

    try {

        await connectDB();


        const [
            minuteCandleCount,
            quarterCandleCount,
            minuteChochCount,
            quarterChochCount,
            bosCount,
            fvgAgg,
            config,
        ] = await Promise.all([

            MinuteCandle.estimatedDocumentCount(),

            QuarterCandle.estimatedDocumentCount(),

            MinuteChoch.estimatedDocumentCount(),

            QuarterChoch.estimatedDocumentCount(),

            Bos.estimatedDocumentCount(),

            Fvg.aggregate([
                {$project: {count: {$size: "$fvgs"}}},
                {$group: {_id: null, total: {$sum: "$count"}}},
            ]),

            Config.findOne().lean(),

        ]);


        return NextResponse.json({

            success: true,

            data: {

                candles: {
                    minute: minuteCandleCount,
                    quarter: quarterCandleCount,
                },

                choch: {
                    minute: minuteChochCount,
                    quarter: quarterChochCount,
                },

                bos: bosCount,

                fvg: fvgAgg[0]?.total ?? 0,

                lastCheckpoints: config ?? null,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching dashboard stats:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch dashboard stats",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
