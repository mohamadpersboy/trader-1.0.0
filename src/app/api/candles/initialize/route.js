import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import {initializeCandles} from "@/services/candles/candle.service";


export async function GET(request) {

    try {

        await connectDB();

        const {searchParams} = new URL(request.url);

        const countback = searchParams.get("countback")

        const result = await initializeCandles({countback});

        return NextResponse.json(result);

    } catch (error) {

        return NextResponse.json({
            success: false, message: error.message
        }, {
            status: 500
        });

    }
}