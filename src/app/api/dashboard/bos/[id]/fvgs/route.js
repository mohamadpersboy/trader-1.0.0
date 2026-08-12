import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import Fvg from "@/models/fvg.model";


export const dynamic = "force-dynamic";


//=======================================================================//
//                   FETCH FVGs FOR A SINGLE BOS                        //
//-----------------------------------------------------------------------//
//  این روت فقط وقتی صدا زده می‌شه که کاربر یه ردیف BOS رو توی جدول       //
//  expand کنه - چون هر Bos حداکثر چند تا FVG داره، پجینیشن لازم نیست.    //
//=======================================================================//

export async function GET(request, {params}) {

    try {

        await connectDB();


        const {id} = await params;


        const fvgDoc = await Fvg
            .findOne({bosId: id})
            .lean();


        return NextResponse.json({

            success: true,

            data: fvgDoc?.fvgs ?? [],

        }, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Error fetching FVGs for BOS:", error);


        return NextResponse.json({

            success: false,

            message: "Failed to fetch FVGs for this BOS",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
