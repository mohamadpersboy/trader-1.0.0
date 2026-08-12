import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import {cursorPaginate} from "@/lib/cursor-pagination";

import MinuteChoch from "@/models/minute-choch.model";
import TempMinuteChoch from "@/models/temp-minute-choch.model";
import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";
import Fvg from "@/models/fvg.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                        FETCH MINUTE CHOCH                            //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        const result = await cursorPaginate(MinuteChoch, {

            cursor: searchParams.get("cursor"),

            direction: searchParams.get("direction") === "prev" ? "prev" : "next",

            limit: searchParams.get("limit"),

        });


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching minute CHOCH (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch minute CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                CLEAR MINUTE CHOCH (+ BOS + FVG)                       //
//-----------------------------------------------------------------------//
//  BOS مستقیم به MinuteChoch وابسته‌ست (detectBos ازش می‌خونه)، و Fvg هم  //
//  به Bos وابسته‌ست - پس هر دو رو هم پاک می‌کنیم.                        //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const [
            deletedChoch,
            deletedTempChoch,
            deletedBos,
            deletedTempBos,
            deletedFvg,
        ] = await Promise.all([

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

            config.lastMinuteChochCheckIndex = 0;
            config.lastBosCheckIndex = 0;

            await config.save();

        }


        return NextResponse.json({

            success: true,

            message: "Minute CHOCH and everything derived from it (BOS, FVG) were cleared.",

            deleted: {

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

        console.error("❌ Error clearing minute CHOCH:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear minute CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
