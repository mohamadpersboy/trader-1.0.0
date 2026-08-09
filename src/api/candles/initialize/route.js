import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import {initializeCandles} from "@/services/candles/candle.service";


export async function POST() {

    try {

        await connectDB();


        const result = await initializeCandles();


        return NextResponse.json(result);


    } catch (error) {

        return NextResponse.json({
            success: false, message: error.message
        }, {
            status: 500
        });

    }
}