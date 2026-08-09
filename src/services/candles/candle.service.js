import MinuteCandle from "@/models/minute-candle.model";
import QuarterCandle from "@/models/quarter-candle.model";
import Config from "@/models/config.model";

import fetchMinuteCandles from "./fetch-minute-candles";
import fetchQuarterCandles from "./fetch-quarter-candles";

import {convertOneMinToFifteen} from "@/utils/candle-time";


export async function initializeCandles({ countback = 1440 } = {}) {


    console.log("🔄 Starting initialize candles service...");


    const [minutePreviousCount, quarterPreviousCount] = await Promise.all([

        MinuteCandle.countDocuments({}),

        QuarterCandle.countDocuments({})]);


    // دریافت کندل های 1 دقیقه
    const minuteCandles = await fetchMinuteCandles({
        countback
    });


    if (!Array.isArray(minuteCandles) || minuteCandles.length === 0) {

        return {
            success: false, message: "No minute candles found"
        };

    }


    /*
        پاک کردن اطلاعات قبلی
        چون این متد برای refresh اولیه است
    */

    const deletedMinute = await MinuteCandle.deleteMany({});


    const insertedMinute = await MinuteCandle.insertMany(minuteCandles);


    /*
        دریافت 15 دقیقه
    */


    const beginTime = convertOneMinToFifteen(minuteCandles[0].time);


    const quarterCandles = await fetchQuarterCandles({
        beginTime
    });


    let quarterResult = {

        deletedCount: 0,

        insertedCount: 0
    };


    if (Array.isArray(quarterCandles) && quarterCandles.length) {


        const deletedQuarter = await QuarterCandle.deleteMany({});


        const insertedQuarter = await QuarterCandle.insertMany(quarterCandles);


        quarterResult = {

            deletedCount: deletedQuarter.deletedCount,

            insertedCount: insertedQuarter.length
        };

    }


    /*
        Update Config
    */


    let config = await Config.findOne();


    if (!config) {

        config = await Config.create({});

    }


    config.lastMinuteCandleIndex = insertedMinute[insertedMinute.length - 1].index;


    if (quarterResult.insertedCount) {

        config.lastQuarterCandleIndex = quarterCandles[quarterCandles.length - 1].index;

    }


    await config.save();


    return {

        success: true,

        minute: {

            previousCount: minutePreviousCount,

            deletedCount: deletedMinute.deletedCount,

            insertedCount: insertedMinute.length
        },


        quarter: {

            previousCount: quarterPreviousCount,

            ...quarterResult
        }
    };

}

export async function getMinuteCandles({page = 1, limit = 10, sort = 1,} = {}) {

    const options = {
        page, limit, sort: {
            index: sort,
        }, lean: true,
    };

    const result = await MinuteCandle.paginate({}, options);

    return {
        success: true,

        data: result.docs,

        pagination: {
            totalDocs: result.totalDocs,

            totalPages: result.totalPages,

            currentPage: result.page,

            limit: result.limit,

            hasNextPage: result.hasNextPage,

            hasPrevPage: result.hasPrevPage,
        },
    };
}

export async function getQuarterCandles({page = 1, limit = 10, sort = 1,} = {}) {

    const options = {
        page, limit, sort: {
            index: sort,
        }, lean: true,
    };

    const result = await QuarterCandle.paginate({}, options);

    return {
        success: true,

        data: result.docs,

        pagination: {
            totalDocs: result.totalDocs,

            totalPages: result.totalPages,

            currentPage: result.page,

            limit: result.limit,

            hasNextPage: result.hasNextPage,

            hasPrevPage: result.hasPrevPage,
        },
    };
}

export async function updateCandles() {

    console.log("🚀 Starting candles update...");


    /*
     * Step 1:
     * گرفتن آخرین کندل‌های موجود
     */

    const [lastMinuteCandle, lastQuarterCandle] = await Promise.all([

        MinuteCandle
            .findOne()
            .sort({index: -1}),


        QuarterCandle
            .findOne()
            .sort({index: -1})

    ]);


    /*
     * Step 2:
     * ساخت Config برای دریافت اطلاعات جدید
     */


    const minuteConfig = {

        countback: 0,

        lastIndex: 0,

    };


    if (lastMinuteCandle) {

        minuteConfig.beginTime = lastMinuteCandle.time + 60;


        minuteConfig.lastIndex = lastMinuteCandle.index;

    }


    const quarterConfig = {

        countback: 0,

        lastIndex: 0,

    };


    if (lastQuarterCandle) {

        quarterConfig.beginTime = lastQuarterCandle.time + 900;


        quarterConfig.lastIndex = lastQuarterCandle.index;

    }


    /*
     * Step 3:
     * دریافت کندل‌های جدید از فراز
     */


    const [minuteCandles, quarterCandles

    ] = await Promise.all([

        fetchMinuteCandles(minuteConfig),


        fetchQuarterCandles(quarterConfig)

    ]);


    /*
     * Step 4:
     * ذخیره در MongoDB
     */


    const [insertedMinute, insertedQuarter

    ] = await Promise.all([


        Array.isArray(minuteCandles) && minuteCandles.length > 0

            ?

            MinuteCandle.insertMany(minuteCandles)

            :

            Promise.resolve([]),


        Array.isArray(quarterCandles) && quarterCandles.length > 0

            ?

            QuarterCandle.insertMany(quarterCandles)

            :

            Promise.resolve([])

    ]);


    /*
     * Step 5:
     * اگر دیتای جدیدی نبود
     */


    if (insertedMinute.length === 0 && insertedQuarter.length === 0) {

        return {

            success: true,

            message: "No new candles available.",

            inserted: {
                minute: 0, quarter: 0
            }

        };

    }


    /*
     * Step 6:
     * Update Config
     */


    let config = await Config.findOne();


    if (!config) {

        config = await Config.create({});

    }


    if (insertedMinute.length) {

        config.lastMinuteCandleIndex = insertedMinute[insertedMinute.length - 1].index;

    }


    if (insertedQuarter.length) {

        config.lastQuarterCandleIndex = insertedQuarter[insertedQuarter.length - 1].index;

    }


    await config.save();


    return {

        success: true,

        message: "Candles updated successfully.",


        inserted: {

            minute: insertedMinute.length,


            quarter: insertedQuarter.length

        }

    };

}