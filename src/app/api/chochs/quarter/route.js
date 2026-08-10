import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import QuarterChoch from "@/models/quarter-choch.model";
import TempQuarterChoch from "@/models/temp-quarter-choch.model";
import Config from "@/models/config.model";

import {detectQuarterChoch} from "@/services/chochs/quarter-choch.service";


//=======================================================================//
//                          QUARTER CHOCH API                            //
//=======================================================================//


//=======================================================================//
//                         FETCH QUARTER CHOCH                           //
//=======================================================================//

export async function GET(request) {

    try {

        await connectDB();


        const {searchParams} = new URL(request.url);


        //===================================================================//
        //                         QUERY PARAMETERS                          //
        //===================================================================//

        const page = parseInt(
            searchParams.get("page") || "1"
        );

        const limit = parseInt(
            searchParams.get("limit") || "10"
        );

        const sort = parseInt(
            searchParams.get("sort") || "1"
        );


        //===================================================================//
        //                       DETECT NEW CHOCH                            //
        //===================================================================//

        let config = await Config.findOne();


        if (!config) {
            config = await Config.create({});
        }


        const processedCandles = await detectQuarterChoch(
            config.lastQuarterChochCheckIndex || 0
        );


        if (processedCandles.length > 0) {

            config.lastQuarterChochCheckIndex =
                processedCandles[processedCandles.length - 1].index;

            await config.save();

        }


        //===================================================================//
        //                         PAGINATE OPTIONS                          //
        //===================================================================//

        const options = {

            page,

            limit,

            sort: {
                index: sort,
            },

            lean: true,

        };


        //===================================================================//
        //                      FETCH QUARTER CHOCH                           //
        //===================================================================//

        const result = await QuarterChoch.paginate(
            {},
            options
        );


        //===================================================================//
        //                            RESPONSE                               //
        //===================================================================//

        return NextResponse.json({

            success: true,

            data: result.docs,

            pagination: {

                totalDocs: result.totalDocs,

                totalPages: result.totalPages,

                currentPage: result.page,

                limit: result.limit,

                hasNextPage: result.hasNextPage,

                hasPrevPage: result.hasPrevPage,

                nextPage: result.nextPage,

                prevPage: result.prevPage,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching Quarter CHOCH:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch Quarter CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                         CLEAR QUARTER CHOCH                           //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        console.log("🔄 Starting clearQuarterChochController execution...");


        //===================================================================//
        //                      CLEAR QUARTER CHOCH DATA                      //
        //===================================================================//

        const [
            deletedTempChoch,
            deletedChoch,
        ] = await Promise.all([

            TempQuarterChoch.deleteMany({}),

            QuarterChoch.deleteMany({}),

        ]);


        console.log(
            `✅ Collections cleared: QuarterChoch (TempQuarterChoch(${deletedTempChoch.deletedCount}), QuarterChoch(${deletedChoch.deletedCount}))`
        );


        //===================================================================//
        //                         RESET CONFIG                              //
        //===================================================================//

        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({
                lastQuarterChochCheckIndex: 0,
            });

        } else {

            config.lastQuarterChochCheckIndex = 0;

            await config.save();

        }


        //===================================================================//
        //                            RESPONSE                               //
        //===================================================================//

        return NextResponse.json({

            success: true,

            message: "Quarter CHOCH and all of their configs cleared successfully.",

            deleted: {

                "quarter-choch": deletedChoch.deletedCount ?? 0,

                "temp-quarter-choch": deletedTempChoch.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error in clearQuarterChochController:", error);


        return NextResponse.json({

            status: 500,

            statusText: "Internal Server Error",

            success: false,

            message: error.message,

        }, {
            status: 500,
        });

    }

}
