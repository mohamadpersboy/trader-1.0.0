import {NextResponse} from "next/server";

import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";
import Config from "@/models/config.model";


//=======================================================================//
//                              BOS API                                  //
//=======================================================================//


//=======================================================================//
//                            FETCH BOS                                  //
//=======================================================================//

export async function GET(request) {

    try {

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

