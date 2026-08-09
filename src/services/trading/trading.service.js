import MinuteCandle from "@/models/minute-candle.model";
import QuarterCandle from "@/models/quarter-candle.model";

import MinuteChoch from "@/models/minute-choch.model";
import TempMinuteChoch from "@/models/temp-minute-choch.model";

import QuarterChoch from "@/models/quarter-choch.model";
import TempQuarterChoch from "@/models/temp-quarter-choch.model";

import Bos from "@/models/bos.model";
import TempBos from "@/models/temp-bos.model";

import Fvg from "@/models/fvg.model";

import Config from "@/models/config.model";


export async function resetTradingData() {
    console.log("🔄 Starting trading data reset...");


    /*
     * حذف هم‌زمان تمام داده‌های مربوط به ربات
     */
    const [
        deletedMinuteCandles,
        deletedQuarterCandles,

        deletedMinuteChochs,
        deletedTempMinuteChochs,

        deletedQuarterChochs,
        deletedTempQuarterChochs,

        deletedBos,
        deletedTempBos,

        deletedFvgs,
    ] = await Promise.all([
        MinuteCandle.deleteMany({}),
        QuarterCandle.deleteMany({}),

        MinuteChoch.deleteMany({}),
        TempMinuteChoch.deleteMany({}),

        QuarterChoch.deleteMany({}),
        TempQuarterChoch.deleteMany({}),

        Bos.deleteMany({}),
        TempBos.deleteMany({}),

        Fvg.deleteMany({}),
    ]);


    /*
     * دریافت Config موجود
     * اگر وجود نداشت، یک Config جدید ایجاد می‌شود.
     */
    let config = await Config.findOne();


    if (!config) {
        config = await Config.create({});
    }


    /*
     * بازگرداندن تمام وضعیت‌های پردازش به مقدار اولیه
     */
    config.lastMinuteCandleIndex = 0;

    config.lastQuarterCandleIndex = 0;

    config.lastMinuteChochCheckIndex = 0;

    config.lastQuarterChochCheckIndex = 0;

    config.lastBosCheckIndex = 0;


    await config.save();


    console.log("✅ Trading data reset completed successfully.");


    /*
     * نتیجه عملیات
     */
    return {
        success: true,

        message: "All trading data was reset successfully.",

        deleted: {
            minuteCandles:
                deletedMinuteCandles.deletedCount ?? 0,

            quarterCandles:
                deletedQuarterCandles.deletedCount ?? 0,

            minuteChochs:
                deletedMinuteChochs.deletedCount ?? 0,

            tempMinuteChochs:
                deletedTempMinuteChochs.deletedCount ?? 0,

            quarterChochs:
                deletedQuarterChochs.deletedCount ?? 0,

            tempQuarterChochs:
                deletedTempQuarterChochs.deletedCount ?? 0,

            bos:
                deletedBos.deletedCount ?? 0,

            tempBos:
                deletedTempBos.deletedCount ?? 0,

            fvgs:
                deletedFvgs.deletedCount ?? 0,
        },
    };
}