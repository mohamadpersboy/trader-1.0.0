// ============================================================================
//  Runtime Tick Service
// ----------------------------------------------------------------------------
//  منطق "یک دور کامل بررسی" (fetch یک کندل جدید -> detect choch -> detect bos)
//  این‌جا جدا شده تا هم توسط اسکریپت مستقل (src/runtime/live-runtime.mjs، برای
//  اجرای local/self-hosted) و هم توسط API route ای که Vercel Cron صداش می‌زنه
//  (src/app/api/runtime/tick/route.js) قابل استفاده باشه.
//
//  عمداً از importهای نسبی استفاده شده (نه alias "@/") چون این فایل باید هم
//  زیر Next.js (که alias رو resolve می‌کنه) و هم با node خام (که alias رو
//  نمی‌شناسه) قابل import باشه؛ importهای نسبی توی هر دو محیط کار می‌کنن.
// ============================================================================

import connectDB from "@/lib/mongodb.js";

import Config from "@/models/config.model.js";
import MinuteCandle from "@/models/minute-candle.model.js";
import QuarterCandle from "@/models/quarter-candle.model.js";

import fetchMinuteCandles from "@/services/candles/fetch-minute-candles.js";
import fetchQuarterCandles from "@/services/candles/fetch-quarter-candles.js";

import {convertOneMinToFifteen} from "@/utils/candle-time.js";

import {detectMinuteChoch} from "@/services/chochs/minute-choch.service.js";
import {detectQuarterChoch} from "@/services/chochs/quarter-choch.service.js";
import {detectBos} from "@/services/bos/bos.service.js";


//=======================================================================//
//              STEP 1: FETCH & STORE ONE NEW MINUTE CANDLE              //
//=======================================================================//
// دقیقاً معادل رفتار initializeCandles با countback=1: یک کندل آخر برگردونده
// می‌شه. برخلاف initializeCandles، این‌جا افزایشی insert می‌کنیم (نه پاک‌سازی).

async function fetchAndStoreOneMinuteCandle() {

    const lastMinuteCandle = await MinuteCandle
        .findOne()
        .sort({index: -1})
        .lean();


    const fetchOptions = {
        countback: 1,
    };


    if (lastMinuteCandle) {

        fetchOptions.beginTime = lastMinuteCandle.time + 60;

        fetchOptions.lastIndex = lastMinuteCandle.index;

    }


    const minuteCandles = await fetchMinuteCandles(fetchOptions);


    if (!Array.isArray(minuteCandles) || minuteCandles.length === 0) {

        return null;

    }


    const candle = minuteCandles[minuteCandles.length - 1];


    if (lastMinuteCandle && candle.time <= lastMinuteCandle.time) {

        return null;

    }


    const [inserted] = await MinuteCandle.insertMany([candle]);


    return inserted;

}


//=======================================================================//
//         STEP 2: CHECK & STORE THE MATCHING 15-MIN QUARTER CANDLE      //
//=======================================================================//

async function fetchAndStoreMatchingQuarterCandle(minuteCandle) {

    if (!minuteCandle) {
        return null;
    }


    const lastQuarterCandle = await QuarterCandle
        .findOne()
        .sort({index: -1})
        .lean();


    const beginTime = convertOneMinToFifteen(minuteCandle.time);


    const fetchOptions = {
        countback: 0,
        beginTime,
    };


    if (lastQuarterCandle) {

        fetchOptions.lastIndex = lastQuarterCandle.index;

    }


    const quarterCandles = await fetchQuarterCandles(fetchOptions);


    if (!Array.isArray(quarterCandles) || quarterCandles.length === 0) {

        return null;

    }


    const candle = quarterCandles[quarterCandles.length - 1];


    if (lastQuarterCandle && candle.time <= lastQuarterCandle.time) {

        return null;

    }


    const [inserted] = await QuarterCandle.insertMany([candle]);


    return inserted;

}


//=======================================================================//
//        STEP 3: RUN CHOCH DETECTION (MINUTE + QUARTER, CONCURRENT)     //
//=======================================================================//

async function runChochDetection(config, {hasNewMinuteCandle, hasNewQuarterCandle}) {

    const jobs = [];

    const summary = {
        minuteChochProcessed: 0,
        quarterChochProcessed: 0,
    };


    if (hasNewMinuteCandle) {

        jobs.push(

            detectMinuteChoch(config.lastMinuteChochCheckIndex || 0)
                .then((processed) => {

                    summary.minuteChochProcessed = processed.length;

                    if (processed.length > 0) {

                        config.lastMinuteChochCheckIndex =
                            processed[processed.length - 1].index;

                    }

                })

        );

    }


    if (hasNewQuarterCandle) {

        jobs.push(

            detectQuarterChoch(config.lastQuarterChochCheckIndex || 0)
                .then((processed) => {

                    summary.quarterChochProcessed = processed.length;

                    if (processed.length > 0) {

                        config.lastQuarterChochCheckIndex =
                            processed[processed.length - 1].index;

                    }

                })

        );

    }


    if (jobs.length > 0) {

        await Promise.all(jobs);

    }


    return summary;

}


//=======================================================================//
//                    STEP 4: RUN BOS DETECTION                          //
//=======================================================================//

async function runBosDetection(config) {

    // detectBos همیشه {lastIndex, bosProcessed, stoppedEarly, ...} برمی‌گردونه
    // (نه آرایه) - lastIndex معتبره حتی وقتی stoppedEarly باشه (به‌خاطر یک
    // FVG/OB هنوز تأیید نشده)، چون تا همون‌جا واقعاً کندل‌ها بررسی شدن.

    const result = await detectBos(config.lastBosCheckIndex || 0);


    if (
        result.lastIndex !== null &&
        result.lastIndex !== undefined &&
        result.lastIndex > (config.lastBosCheckIndex || 0)
    ) {

        config.lastBosCheckIndex = result.lastIndex;

    }


    return {
        bosProcessed: result.bosProcessed,
        stoppedEarly: result.stoppedEarly,
    };

}


//=======================================================================//
//                  PUBLIC: RUN ONE FULL RUNTIME TICK                    //
//=======================================================================//
// این تابع "یک دور کامل" رو اجرا می‌کنه و یک summary برمی‌گردونه (بدون لاگ
// اجباری) تا هم caller اسکریپتی و هم caller HTTP بتونن خودشون تصمیم بگیرن
// چطور نتیجه رو نمایش/لاگ کنن.

export async function runRuntimeTick() {

    await connectDB();


    let config = await Config.findOne();


    if (!config) {

        config = await Config.create({});

    }


    //-------------------------------------------------------------//
    //                 1) FETCH ONE NEW MINUTE CANDLE               //
    //-------------------------------------------------------------//

    const newMinuteCandle = await fetchAndStoreOneMinuteCandle();


    if (newMinuteCandle) {

        config.lastMinuteCandleIndex = newMinuteCandle.index;

    }


    //-------------------------------------------------------------//
    //         2) CHECK FOR A MATCHING 15-MIN QUARTER CANDLE        //
    //-------------------------------------------------------------//

    const newQuarterCandle = await fetchAndStoreMatchingQuarterCandle(newMinuteCandle);


    if (newQuarterCandle) {

        config.lastQuarterCandleIndex = newQuarterCandle.index;

    }


    if (!newMinuteCandle && !newQuarterCandle) {

        return {

            success: true,

            newMinuteCandle: null,

            newQuarterCandle: null,

            choch: {
                minute: 0,
                quarter: 0,
            },

            bos: 0,

            message: "No new candle yet.",

        };

    }


    //-------------------------------------------------------------//
    //         3) DETECT CHOCH (MINUTE + QUARTER, CONCURRENT)       //
    //-------------------------------------------------------------//

    const chochSummary = await runChochDetection(config, {

        hasNewMinuteCandle: Boolean(newMinuteCandle),

        hasNewQuarterCandle: Boolean(newQuarterCandle),

    });


    //-------------------------------------------------------------//
    //                       4) DETECT BOS                          //
    //-------------------------------------------------------------//

    const bosSummary = await runBosDetection(config);


    //-------------------------------------------------------------//
    //                       5) SAVE CONFIG                         //
    //-------------------------------------------------------------//

    await config.save();


    //-------------------------------------------------------------//
    //                          6) RETURN                           //
    //-------------------------------------------------------------//

    return {

        success: true,

        newMinuteCandle: newMinuteCandle && {

            index: newMinuteCandle.index,

            time: newMinuteCandle.time,

            formattedTime: newMinuteCandle.formattedTime,

        },

        newQuarterCandle: newQuarterCandle && {

            index: newQuarterCandle.index,

            time: newQuarterCandle.time,

            formattedTime: newQuarterCandle.formattedTime,

        },

        choch: {

            minute: chochSummary.minuteChochProcessed,

            quarter: chochSummary.quarterChochProcessed,

        },

        bos: bosSummary.bosProcessed,

    };

}
