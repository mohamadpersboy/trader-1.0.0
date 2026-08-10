import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import MinuteCandle from "@/models/minute-candle.model";
import QuarterCandle from "@/models/quarter-candle.model";
import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";
import Config from "@/models/config.model";

import {detectBos} from "@/services/bos/bos.service";
import {detectMinuteChoch} from "@/services/chochs/minute-choch.service";
import {detectQuarterChoch} from "@/services/chochs/quarter-choch.service";


//=======================================================================//
//                              BOS API                                  //
//=======================================================================//


//=======================================================================//
//                            FETCH BOS                                  //
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
        //                       LOAD / CREATE CONFIG                        //
        //===================================================================//

        let config = await Config.findOne();


        if (!config) {
            config = await Config.create({});
        }


        //===================================================================//
        //   ENSURE MINUTE & QUARTER CHOCH ARE CHECKED UP TO LAST CANDLE     //
        //                    (RUN CONCURRENTLY)                             //
        //===================================================================//

        const [
            lastMinuteCandle,
            lastQuarterCandle,
        ] = await Promise.all([

            MinuteCandle
                .findOne()
                .sort({index: -1})
                .lean(),

            QuarterCandle
                .findOne()
                .sort({index: -1})
                .lean(),

        ]);

        const lastMinuteCandleIndex = lastMinuteCandle?.index ?? 0;
        const lastQuarterCandleIndex = lastQuarterCandle?.index ?? 0;


        const chochChecks = [];


        if ((config.lastMinuteChochCheckIndex || 0) < lastMinuteCandleIndex) {

            chochChecks.push(

                detectMinuteChoch(config.lastMinuteChochCheckIndex || 0)
                    .then((processedCandles) => {

                        if (processedCandles.length > 0) {

                            config.lastMinuteChochCheckIndex =
                                processedCandles[processedCandles.length - 1].index;

                        }

                    })

            );

        }


        if ((config.lastQuarterChochCheckIndex || 0) < lastQuarterCandleIndex) {

            chochChecks.push(

                detectQuarterChoch(config.lastQuarterChochCheckIndex || 0)
                    .then((processedCandles) => {

                        if (processedCandles.length > 0) {

                            config.lastQuarterChochCheckIndex =
                                processedCandles[processedCandles.length - 1].index;

                        }

                    })

            );

        }


        if (chochChecks.length > 0) {

            //-------------------------------------------------------------------//
            //         RUN MINUTE & QUARTER CHOCH DETECTION IN PARALLEL          //
            //-------------------------------------------------------------------//

            await Promise.all(chochChecks);

            await config.save();

        }


        //===================================================================//
        //                          DETECT NEW BOS                           //
        //===================================================================//

        const processedBosCandles = await detectBos(
            config.lastBosCheckIndex || 0
        );


        if (processedBosCandles.length > 0) {

            config.lastBosCheckIndex =
                processedBosCandles[processedBosCandles.length - 1].index;

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
        //                           FETCH BOS                               //
        //===================================================================//

        const result = await Bos.paginate(
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

        console.error("❌ Error fetching BOS:", error);


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
//                             CLEAR BOS                                 //
//=======================================================================//

export async function DELETE() {

    try {

        await connectDB();


        console.log("🔄 Starting clearBosController execution...");


        //===================================================================//
        //                         CLEAR BOS DATA                            //
        //===================================================================//

        const [
            deletedTempBos,
            deletedBos,
        ] = await Promise.all([

            TempBos.deleteMany({}),

            Bos.deleteMany({}),

        ]);


        console.log(
            `✅ Collections cleared: Bos (TempBos(${deletedTempBos.deletedCount}), Bos(${deletedBos.deletedCount}))`
        );


        //===================================================================//
        //                         RESET CONFIG                              //
        //===================================================================//

        let config = await Config.findOne();


        if (!config) {

            config = await Config.create({
                lastBosCheckIndex: 0,
            });

        } else {

            config.lastBosCheckIndex = 0;

            await config.save();

        }


        //===================================================================//
        //                            RESPONSE                               //
        //===================================================================//

        return NextResponse.json({

            success: true,

            message: "BOS and all of their configs cleared successfully.",

            deleted: {

                bos: deletedBos.deletedCount ?? 0,

                "temp-bos": deletedTempBos.deletedCount ?? 0,

            },

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error in clearBosController:", error);


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
