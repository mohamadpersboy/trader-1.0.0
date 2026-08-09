import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import {updateCandles} from "@/services/candles/candle.service";


export async function POST() {

    try {


        await connectDB();


        const result = await updateCandles();


        return NextResponse.json(result);


    } catch (error) {


        console.error("Update candles error:", error);


        return NextResponse.json({
                success: false, message: error.message
            },

            {
                status: 500
            });

    }

}