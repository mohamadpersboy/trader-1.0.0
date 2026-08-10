import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import MinuteChoch from "@/models/minute-choch.model";
import TempMinuteChoch from "@/models/temp-minute-choch.model";
import Config from "@/models/config.model";

import {detectMinuteChoch} from "@/services/chochs/minute-choch.service";


//=======================================================================//
//                          MINUTE CHOCH API                            //
//=======================================================================//


//=======================================================================//
//                         FETCH MINUTE CHOCH                           //
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


        const processedCandles = await detectMinuteChoch(
            config.lastMinuteChochCheckIndex || 0
        );


        if (processedCandles.length > 0) {

            config.lastMinuteChochCheckIndex =
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
        //                      FETCH MINUTE CHOCH                           //
        //===================================================================//

        const result = await MinuteChoch.paginate(
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

        console.error("❌ Error fetching Minute CHOCH:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch Minute CHOCH",

            error: error.message,

        }, {
            status: 500,
        });

    }

}


//=======================================================================//
//                         CLEAR MINUTE CHOCH                           //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        console.log("🔄 Starting clearMinuteChochController execution...");


        //===================================================================//
        //                      CLEAR MINUTE CHOCH DATA                      //
        //===================================================================//

        const [
            deletedTempChoch,
            deletedChoch,
        ] = await Promise.all([

            TempMinuteChoch.deleteMany({}),

            MinuteChoch.deleteMany({}),

        ]);


        console.log(
            `✅ Collections cleared: MinuteChoch (TempMinuteChoch(${deletedTempChoch.deletedCount}), MinuteChoch(${deletedChoch.deletedCount}))`
        );


        //===================================================================//
        //                         RESET CONFIG                              //
        //===================================================================//

        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({
                lastMinuteChochCheckIndex: 0,
            });

        } else {

            config.lastMinuteChochCheckIndex = 0;

            await config.save();

        }


        //===================================================================//
        //                            RESPONSE                               //
        //===================================================================//

        return NextResponse.json({

            success: true,

            message: "Minute CHOCH and all of their configs cleared successfully.",

            deleted: {

                "minute-choch": deletedChoch.deletedCount ?? 0,

                "temp-minute-choch": deletedTempChoch.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error in clearMinuteChochController:", error);


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
