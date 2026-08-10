import {NextResponse} from "next/server";

import {runRuntimeTick} from "@/services/runtime/runtime.service";


//=======================================================================//
//                           RUNTIME TICK API                            //
//-----------------------------------------------------------------------//
//  این route روی هر invocation فقط "یک دور" runRuntimeTick() رو اجرا     //
//  می‌کنه (fetch یک کندل جدید -> detect choch -> detect bos).            //
//  توسط Vercel Cron (vercel.json) یا یک scheduler بیرونی به‌صورت دوره‌ای //
//  صدا زده می‌شه - خودش loop نمی‌زنه (روی serverless معنی نداره).        //
//=======================================================================//

export const dynamic = "force-dynamic";

export const maxDuration = 60;


export async function GET(request) {

    try {

        //===================================================================//
        //                      VERIFY CRON SECRET                           //
        //===================================================================//
        // Vercel Cron به‌صورت خودکار هدر Authorization: Bearer <CRON_SECRET>
        // می‌فرسته (CRON_SECRET رو خود Vercel می‌سازه). اگه از یک scheduler
        // بیرونی استفاده می‌کنید، باید همین هدر رو دستی توی تنظیمات اون
        // scheduler اضافه کنید.

        const authHeader = request.headers.get("authorization");


        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {

            return NextResponse.json({

                success: false,

                message: "Unauthorized",

            }, {
                status: 401,
            });

        }


        //===================================================================//
        //                         RUN ONE TICK                              //
        //===================================================================//

        const result = await runRuntimeTick();


        return NextResponse.json(result, {
            status: 200,
        });


    } catch (error) {

        console.error("❌ Runtime tick API error:", error);


        return NextResponse.json({

            success: false,

            message: "Runtime tick failed",

            error: error.message,

        }, {
            status: 500,
        });

    }

}
