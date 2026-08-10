// ============================================================================
//  Live Runtime Worker
// ----------------------------------------------------------------------------
//  یک اسکریپت مستقل (خارج از Next.js) که پشت صحنه، به‌صورت مداوم:
//
//   1) دقیقاً یک کندل ۱ دقیقه‌ای جدید رو از فراز می‌گیره (countback=1)
//      - این دقیقاً همون منطقی هست که initializeCandles با countback=1
//        استفاده می‌کنه: fetchMinuteCandles({countback: 1}) آخرین کندل رو
//        برمی‌گردونه.
//   2) اگر در همون لحظه یک کندل ۱۵ دقیقه‌ای هم بسته شده باشه (یعنی
//      convertOneMinToFifteen روی کندل ۱ دقیقه‌ای یک بازه‌ی ۱۵ دقیقه‌ی
//      کامل بده)، اون رو هم می‌گیره - دقیقاً مثل initializeCandles که بعد
//      از گرفتن کندل دقیقه، fetchQuarterCandles(beginTime) رو صدا می‌زنه.
//   3) برخلاف initializeCandles (که کل کالکشن رو پاک و از نو پر می‌کنه و
//      فقط برای "ریفرش اولیه" مناسبه)، این‌جا به‌صورت افزایشی (incremental)
//      کندل جدید رو insert می‌کنیم - دقیقاً با همون الگوی updateCandles.
//   4) بعد از insert هر کندل، بلافاصله detectMinuteChoch / detectQuarterChoch
//      رو صدا می‌زنیم (موازی، همون الگوی روت BOS)، و در آخر detectBos رو.
//   5) نتیجه‌ی هر دور (چند CHOCH و چند BOS جدید پیدا شد) لاگ می‌شه.
//
//  اجرا:
//      node src/runtime/live-runtime.mjs
//
//  یا با اسکریپت npm:
//      npm run runtime
//
//  متغیرهای محیطی:
//      RUNTIME_INTERVAL_MS   فاصله‌ی هر دور بررسی (پیش‌فرض: 15000 = 15 ثانیه)
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import mongoose from "mongoose";


//=======================================================================//
//                        LOAD .env.local MANUALLY                       //
//=======================================================================//
// Next.js خودش .env.local رو لود می‌کنه، ولی اجرای مستقل با node این کار رو
// نمی‌کنه؛ پس این‌جا خودمون به‌سادگی پارسش می‌کنیم (بدون نیاز به پکیج dotenv).

function loadEnvLocal() {

    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const envPath = path.resolve(__dirname, "../../.env.local");


    if (!fs.existsSync(envPath)) {

        console.warn(`⚠️  .env.local not found at ${envPath}, relying on existing process.env`);

        return;

    }


    const content = fs.readFileSync(envPath, "utf-8");


    for (const rawLine of content.split("\n")) {

        const line = rawLine.trim();

        if (!line || line.startsWith("#")) {
            continue;
        }

        const eqIndex = line.indexOf("=");

        if (eqIndex === -1) {
            continue;
        }

        const key = line.slice(0, eqIndex).trim();

        let value = line.slice(eqIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }

    }

}

loadEnvLocal();


//=======================================================================//
//                    RELATIVE IMPORTS (NO "@/" ALIAS)                   //
//=======================================================================//
// این فایل با node اجرا می‌شه، نه با webpack/turbopack، پس alias "@/*" کار
// نمی‌کنه و باید مسیرهای نسبی بدیم.

import connectDB from "../lib/mongodb.js";

import Config from "../models/config.model.js";
import MinuteCandle from "../models/minute-candle.model.js";
import QuarterCandle from "../models/quarter-candle.model.js";

import fetchMinuteCandles from "../services/candles/fetch-minute-candles.js";
import fetchQuarterCandles from "../services/candles/fetch-quarter-candles.js";

import {convertOneMinToFifteen} from "../utils/candle-time.js";

import {detectMinuteChoch} from "../services/chochs/minute-choch.service.js";
import {detectQuarterChoch} from "../services/chochs/quarter-choch.service.js";
import {detectBos} from "../services/bos/bos.service.js";


//=======================================================================//
//                              CONFIG                                   //
//=======================================================================//

const INTERVAL_MS = Number(process.env.RUNTIME_INTERVAL_MS) || 15000;

let isShuttingDown = false;

let isTickRunning = false;


//=======================================================================//
//                              HELPERS                                  //
//=======================================================================//

function sleep(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}


//=======================================================================//
//              STEP 1: FETCH & STORE ONE NEW MINUTE CANDLE              //
//=======================================================================//
// دقیقاً معادل رفتار initializeCandles با countback=1: یک کندل آخر برگردونده
// می‌شه. برخلاف initializeCandles، اینجا افزایشی insert می‌کنیم (نه پاک‌سازی).

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


    // آخرین کندل برگشتی رو در نظر می‌گیریم (countback=1 یعنی یکی برمی‌گرده)

    const candle = minuteCandles[minuteCandles.length - 1];


    // جلوگیری از insert تکراری اگه کندلی به‌روزرسانی نشده باشه

    if (lastMinuteCandle && candle.time <= lastMinuteCandle.time) {

        return null;

    }


    const [inserted] = await MinuteCandle.insertMany([candle]);


    return inserted;

}


//=======================================================================//
//         STEP 2: CHECK & STORE THE MATCHING 15-MIN QUARTER CANDLE      //
//=======================================================================//
// اگر لحظه‌ی این کندل ۱ دقیقه‌ای دقیقاً پایان یک بازه‌ی ۱۵ دقیقه‌ای هم باشه،
// کندل ۱۵ دقیقه‌ای متناظر رو هم می‌گیریم و ذخیره می‌کنیم.

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

    const processed = await detectBos(config.lastBosCheckIndex || 0);


    if (processed.length > 0) {

        config.lastBosCheckIndex =
            processed[processed.length - 1].index;

    }


    return {
        bosProcessed: processed.length,
    };

}


//=======================================================================//
//                        ONE FULL RUNTIME TICK                          //
//=======================================================================//

async function tick() {

    if (isTickRunning) {

        console.warn("⏳ Previous tick still running, skipping this cycle.");

        return;

    }


    isTickRunning = true;


    try {

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

            console.log("😴 No new candle yet.");

            return;

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
        //                          6) LOG                              //
        //-------------------------------------------------------------//

        console.log(

            "✅ Tick done |",

            newMinuteCandle
                ? `minute candle #${newMinuteCandle.index} (${newMinuteCandle.formattedTime})`
                : "no new minute candle",

            "|",

            newQuarterCandle
                ? `quarter candle #${newQuarterCandle.index} (${newQuarterCandle.formattedTime})`
                : "no new quarter candle",

            "| choch(minute):", chochSummary.minuteChochProcessed,

            "| choch(quarter):", chochSummary.quarterChochProcessed,

            "| bos:", bosSummary.bosProcessed

        );


    } catch (error) {

        console.error("❌ Runtime tick failed:", error);

    } finally {

        isTickRunning = false;

    }

}


//=======================================================================//
//                          MAIN RUNTIME LOOP                            //
//=======================================================================//

async function startRuntime() {

    await connectDB();


    console.log(`🚀 Live runtime started (interval: ${INTERVAL_MS}ms)`);


    while (!isShuttingDown) {

        await tick();

        await sleep(INTERVAL_MS);

    }

}


//=======================================================================//
//                        GRACEFUL SHUTDOWN                              //
//=======================================================================//

async function shutdown(signal) {

    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;


    console.log(`\n🛑 Received ${signal}, shutting down runtime...`);


    try {

        await mongoose.connection.close();

        console.log("🔌 MongoDB connection closed.");

    } catch (error) {

        console.error("Error closing MongoDB connection:", error);

    }


    process.exit(0);

}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));


//=======================================================================//
//                                RUN                                    //
//=======================================================================//

startRuntime().catch((error) => {

    console.error("❌ Fatal runtime error:", error);

    process.exit(1);

});
