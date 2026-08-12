import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import {cursorPaginate} from "@/lib/cursor-pagination";

import QuarterChoch from "@/models/quarter-choch.model";
import TempQuarterChoch from "@/models/temp-quarter-choch.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                        FETCH QUARTER CHOCH                           //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        const result = await cursorPaginate(QuarterChoch, {

            cursor: searchParams.get("cursor"),

            direction: searchParams.get("direction") === "prev" ? "prev" : "next",

            limit: searchParams.get("limit"),

        });


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching quarter CHOCH (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch quarter CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                        CLEAR QUARTER CHOCH                            //
//-----------------------------------------------------------------------//
//  چیزی به QuarterChoch وابسته نیست (BOS فقط minute choch می‌خونه)، پس   //
//  زنجیره‌ی پاک‌سازی کوتاهه.                                              //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const [
            deletedChoch,
            deletedTempChoch,
        ] = await Promise.all([

            QuarterChoch.deleteMany({}),

            TempQuarterChoch.deleteMany({}),

        ]);


        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({});

        } else {

            config.lastQuarterChochCheckIndex = 0;

            await config.save();

        }


        return NextResponse.json({

            success: true,

            message: "Quarter CHOCH was cleared.",

            deleted: {

                "quarter-choch": deletedChoch.deletedCount ?? 0,

                "temp-quarter-choch": deletedTempChoch.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error clearing quarter CHOCH:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear quarter CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
