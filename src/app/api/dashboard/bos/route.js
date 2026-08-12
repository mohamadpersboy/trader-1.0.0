import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";
import {cursorPaginate} from "@/lib/cursor-pagination";

import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";
import Fvg from "@/models/fvg.model";
import Config from "@/models/config.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                            FETCH BOS                                 //
//-----------------------------------------------------------------------//
//  به هر ردیف BOS تعداد FVG های مرتبطش رو هم اضافه می‌کنیم (فقط count،   //
//  نه خود fvg ها) تا توی UI بشه به‌عنوان badge نشون داد بدون این‌که کل    //
//  آرایه‌ی fvgs برای صفحه‌ای با ده‌ها ردیف منتقل بشه. جزئیات کامل fvg ها  //
//  فقط وقتی کاربر accordion رو باز کرد از /api/dashboard/bos/[id]/fvgs   //
//  گرفته می‌شه (lazy).                                                   //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        const result = await cursorPaginate(Bos, {

            cursor: searchParams.get("cursor"),

            direction: searchParams.get("direction") === "prev" ? "prev" : "next",

            limit: searchParams.get("limit"),

        });


        if (result.data.length > 0) {

            const bosIds = result.data.map((bos) => bos._id);


            const fvgCounts = await Fvg.aggregate([
                {$match: {bosId: {$in: bosIds}}},
                {$project: {bosId: 1, count: {$size: "$fvgs"}}},
            ]);


            const countByBosId = new Map(
                fvgCounts.map((row) => [String(row.bosId), row.count])
            );


            result.data = result.data.map((bos) => ({
                ...bos,
                fvgCount: countByBosId.get(String(bos._id)) ?? 0,
            }));

        }


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching BOS (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch BOS",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                        CLEAR BOS (+ FVG)                              //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const [
            deletedBos,
            deletedTempBos,
            deletedFvg,
        ] = await Promise.all([

            Bos.deleteMany({}),

            TempBos.deleteMany({}),

            Fvg.deleteMany({}),

        ]);


        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({});

        } else {

            config.lastBosCheckIndex = 0;

            await config.save();

        }


        return NextResponse.json({

            success: true,

            message: "BOS and derived FVG were cleared.",

            deleted: {

                bos: deletedBos.deletedCount ?? 0,

                "temp-bos": deletedTempBos.deletedCount ?? 0,

                fvg: deletedFvg.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error clearing BOS:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear BOS",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
