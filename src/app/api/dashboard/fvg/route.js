import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import Fvg from "@/models/fvg.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                    FETCH FVG (FLATTENED ACROSS BOS)                  //
//-----------------------------------------------------------------------//
//  هر سند Fvg متعلق به یک Bos هست و شامل آرایه‌ای از fvg هاست (نه یک     //
//  رکورد مستقل به‌ازای هر fvg). برای تب "FVG" که باید مثل بقیه‌ی جدول‌ها  //
//  مسطح و صفحه‌بندی‌شده باشه، اینجا با $unwind تخت‌ش می‌کنیم و روی همون   //
//  index داخلی هر آیتم cursor پیجینیشن می‌زنیم.                          //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);

        const cursorParam = searchParams.get("cursor");

        const direction = searchParams.get("direction") === "prev" ? "prev" : "next";

        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 25, 1), 200);

        const numericCursor = cursorParam !== null && cursorParam !== ""
            ? Number(cursorParam)
            : null;


        const sortDirection = direction === "prev" ? -1 : 1;

        const matchStage = {};

        if (numericCursor !== null && !Number.isNaN(numericCursor)) {

            matchStage["fvgs.index"] = direction === "prev"
                ? {$lt: numericCursor}
                : {$gt: numericCursor};

        }


        const pipeline = [
            {$unwind: "$fvgs"},

            ...(Object.keys(matchStage).length > 0 ? [{$match: matchStage}] : []),

            {$sort: {"fvgs.index": sortDirection}},

            {$limit: limit + 1},

            {
                $project: {
                    _id: "$fvgs._id",
                    bosId: 1,
                    type: "$fvgs.type",
                    index: "$fvgs.index",
                    high: "$fvgs.high",
                    low: "$fvgs.low",
                    time: "$fvgs.time",
                    formattedTime: "$fvgs.formattedTime",
                    use: "$fvgs.use",
                },
            },
        ];


        let docs = await Fvg.aggregate(pipeline);


        const hasMore = docs.length > limit;

        docs = docs.slice(0, limit);

        if (direction === "prev") {
            docs.reverse();
        }


        const firstItem = docs[0] ?? null;

        const lastItem = docs[docs.length - 1] ?? null;


        return NextResponse.json({

            success: true,

            data: docs,

            pageInfo: {

                limit,

                count: docs.length,

                startCursor: firstItem ? firstItem.index : null,

                endCursor: lastItem ? lastItem.index : null,

                hasNextPage: direction === "prev" ? true : hasMore,

                hasPrevPage: direction === "prev" ? hasMore : numericCursor !== null,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching FVG (dashboard):", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch FVG",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                            CLEAR FVG                                  //
//-----------------------------------------------------------------------//
//  FVG هنوز به pipeline detect وصل نیست (checkpoint جدا توی Config       //
//  نداره)، پس پاک کردنش فقط خودِ کالکشن Fvg رو خالی می‌کنه.               //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        const deletedFvg = await Fvg.deleteMany({});


        return NextResponse.json({

            success: true,

            message: "FVG was cleared.",

            deleted: {

                fvg: deletedFvg.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error clearing FVG:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to clear FVG",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
