import {NextResponse} from "next/server";

import connectDB from "@/lib/mongodb";

import {getMinuteCandles,} from "@/services/candles/candle.service";


export async function GET(request) {
    try {
        await connectDB();


        const {searchParams} = new URL(request.url);


        const page = Math.max(Number(searchParams.get("page")) || 1, 1);


        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 10, 1), 100);


        const requestedSort = Number(searchParams.get("sort"));


        const sort = requestedSort === -1 ? -1 : 1;


        const result = await getMinuteCandles({
            page, limit, sort,
        });


        return NextResponse.json(result, {
            status: 200,
        });

    } catch (error) {

        console.error("Error fetching minute candles:", error);


        return NextResponse.json({
            success: false,

            message: "Failed to fetch minute candles",

            error: error.message,
        }, {
            status: 500,
        });

    }
}