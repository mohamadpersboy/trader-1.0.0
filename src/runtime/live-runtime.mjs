// ============================================================================
//  Live Runtime Worker (local / self-hosted only — NOT for Vercel)
// ----------------------------------------------------------------------------
//  یک اسکریپت مستقل که پشت صحنه، به‌صورت مداوم runRuntimeTick() رو صدا می‌زنه.
//
//  ⚠️ این فایل روی Vercel اجرا نمی‌شه (serverless = بدون process دائمی).
//     برای Vercel از src/app/api/runtime/tick/route.js + Vercel Cron (یا یک
//     scheduler بیرونی) استفاده کنید. جزئیات کامل در runtime README.
//
//  اجرا (local/VPS):
//      node src/runtime/live-runtime.mjs
//      npm run runtime
//
//  متغیرهای محیطی:
//      RUNTIME_INTERVAL_MS   فاصله‌ی هر دور بررسی (پیش‌فرض: 15000 = 15 ثانیه)
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import mongoose from "mongoose";

import {runRuntimeTick} from "../services/runtime/runtime.service.js";


//=======================================================================//
//                        LOAD .env.local MANUALLY                       //
//=======================================================================//

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
//                              CONFIG                                   //
//=======================================================================//

const INTERVAL_MS = Number(process.env.RUNTIME_INTERVAL_MS) || 15000;

let isShuttingDown = false;

let isTickRunning = false;


function sleep(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}


//=======================================================================//
//                        ONE FULL RUNTIME TICK + LOG                    //
//=======================================================================//

async function tick() {

    if (isTickRunning) {

        console.warn("⏳ Previous tick still running, skipping this cycle.");

        return;

    }


    isTickRunning = true;


    try {

        const result = await runRuntimeTick();


        if (!result.newMinuteCandle && !result.newQuarterCandle) {

            console.log("😴 No new candle yet.");

            return;

        }


        console.log(

            "✅ Tick done |",

            result.newMinuteCandle
                ? `minute candle #${result.newMinuteCandle.index} (${result.newMinuteCandle.formattedTime})`
                : "no new minute candle",

            "|",

            result.newQuarterCandle
                ? `quarter candle #${result.newQuarterCandle.index} (${result.newQuarterCandle.formattedTime})`
                : "no new quarter candle",

            "| choch(minute):", result.choch.minute,

            "| choch(quarter):", result.choch.quarter,

            "| bos:", result.bos

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
