import { convertOneMinToFifteen } from "@/utils/candle-time";
import QuarterCandle from "@/models/quarter-candle.model";

//=======================================================================//
//                             DETECT OB                                 //
//=======================================================================//

export default async function detectOB(bos) {

    const {
        type,
        fvgs = [],
    } = bos;

    //===================================================================//
    //                         FETCH CANDLES                             //
    //===================================================================//

    const startTime = convertOneMinToFifteen(
        bos.startTime - 900
    );

    const endTime = convertOneMinToFifteen(
        bos.endTime
    );

    const candles = await QuarterCandle
        .find({
            time: {
                $gte: startTime,
                $lte: endTime,
            },
        })
        .sort({
            time: 1,
        })
        .lean();

    if (candles.length === 0) {
        return [];
    }

    //===================================================================//
    //                         CONFIG                                     //
    //===================================================================//

    const lastCandleIndex = candles[candles.length - 1].index;

    let startIndex = candles[0].index;

    const obs = [];

    //===================================================================//
    //                         MAIN LOOP                                  //
    //===================================================================//

    while (startIndex <= lastCandleIndex) {

        const filteredCandles = candles.filter(
            (candle) => candle.index >= startIndex
        );

        if (filteredCandles.length === 0) {
            break;
        }

        //===============================================================//
        //                         CREATE OB                              //
        //===============================================================//

        const ob = {
            type,
            index: 0,
            base: null,
            update: null,
            break: null,
            top: 0,
            bottom: 0,
            use: false,
            fvgs: [],
        };

        //===============================================================//
        //                         BULLISH                                //
        //===============================================================//

        if (type === "bullish") {

            //===========================================================//
            // FIND BASE
            // بین کندل‌های bearish، کمترین low
            //===========================================================//

            ob.base = filteredCandles.reduce(
                (lowestCandle, candle) => {

                    // فقط bearish
                    if (candle.close >= candle.open) {
                        return lowestCandle;
                    }

                    // اولین bearish
                    if (!lowestCandle) {
                        return candle;
                    }

                    // bearish با low پایین‌تر
                    if (candle.low < lowestCandle.low) {
                        return candle;
                    }

                    return lowestCandle;

                },
                null
            );

            //===========================================================//
            // FIND UPDATE / BREAK
            //===========================================================//

            if (ob.base) {

                for (
                    let k = 0;
                    k < filteredCandles.length;
                    k++
                ) {

                    const candle = filteredCandles[k];

                    // قبل از base را بررسی نکن
                    if (candle.index <= ob.base.index) {
                        continue;
                    }

                    if (ob.update) {

                        if (candle.high > ob.update.high) {

                            if (candle.close > ob.update.high) {

                                ob.break = candle;

                                break;

                            } else {

                                ob.update = candle;

                            }

                        }

                    } else {

                        if (candle.high > ob.base.high) {

                            if (candle.close > ob.base.high) {

                                ob.break = candle;

                                break;

                            } else {

                                ob.update = candle;

                            }

                        }

                    }

                }

            }

            //===========================================================//
            // FVG
            //===========================================================//

            if (
                ob.break &&
                ob.update === null &&
                fvgs.length !== 0
            ) {

                const nextFVGs = fvgs.filter(
                    (fvg) => fvg.index >= ob.break.index
                );

                for (const fvg of nextFVGs) {

                    if (fvg.low <= ob.base.high) {

                        ob.top = ob.base.high;
                        ob.bottom = ob.base.low;

                        break;

                    } else {

                        ob.top = ob.base.open;
                        ob.bottom = ob.base.low;

                        break;

                    }

                }

                //=======================================================//
                // CHECK USE
                //=======================================================//

                for (
                    let x = filteredCandles.findIndex(
                        (candle) => candle.index === ob.break.index
                    ) + 1;

                    x < filteredCandles.length;

                    x++
                ) {

                    if (filteredCandles[x].low < ob.top) {

                        ob.use = true;

                        break;

                    }

                }

            }

                //===========================================================//
                // BREAK + UPDATE
            //===========================================================//

            else if (
                ob.break &&
                ob.update
            ) {

                ob.top = ob.base.open;
                ob.bottom = ob.base.low;

                //=======================================================//
                // CHECK USE
                //=======================================================//

                for (
                    let x = filteredCandles.findIndex(
                        (candle) => candle.index === ob.break.index
                    ) + 1;

                    x < filteredCandles.length;

                    x++
                ) {

                    if (filteredCandles[x].low < ob.top) {

                        ob.use = true;

                        break;

                    }

                }

            }

        }

            //================================================================//
            //                         BEARISH                                //
            //================================================================//

        else {

            //===========================================================//
            // FIND BASE
            // بین کندل‌های bullish، بیشترین high
            //===========================================================//

            ob.base = filteredCandles.reduce(
                (highestCandle, candle) => {

                    // فقط bullish
                    if (candle.close <= candle.open) {
                        return highestCandle;
                    }

                    // اولین bullish
                    if (!highestCandle) {
                        return candle;
                    }

                    // bullish با high بالاتر
                    if (candle.high > highestCandle.high) {
                        return candle;
                    }

                    return highestCandle;

                },
                null
            );

            //===========================================================//
            // FIND UPDATE / BREAK
            //===========================================================//

            if (ob.base) {

                for (
                    let k = 0;
                    k < filteredCandles.length;
                    k++
                ) {

                    const candle = filteredCandles[k];

                    // قبل از base را بررسی نکن
                    if (candle.index <= ob.base.index) {
                        continue;
                    }

                    if (ob.update) {

                        if (candle.low < ob.update.low) {

                            if (candle.close < ob.update.low) {

                                ob.break = candle;

                                break;

                            } else {

                                ob.update = candle;

                            }

                        }

                    } else {

                        if (candle.low < ob.base.low) {

                            if (candle.close < ob.base.low) {

                                ob.break = candle;

                                break;

                            } else {

                                ob.update = candle;

                            }

                        }

                    }

                }

            }

            //===========================================================//
            // FVG
            //===========================================================//

            if (
                ob.break &&
                ob.update === null &&
                fvgs.length !== 0
            ) {

                const nextFVGs = fvgs.filter(
                    (fvg) => fvg.index >= ob.break.index
                );

                for (const fvg of nextFVGs) {

                    if (fvg.high >= ob.base.low) {

                        ob.top = ob.base.high;
                        ob.bottom = ob.base.low;

                        break;

                    } else {

                        ob.top = ob.base.high;
                        ob.bottom = ob.base.open;

                        break;

                    }

                }

                //=======================================================//
                // CHECK USE
                //=======================================================//

                for (
                    let x = filteredCandles.findIndex(
                        (candle) => candle.index === ob.break.index
                    ) + 1;

                    x < filteredCandles.length;

                    x++
                ) {

                    if (filteredCandles[x].high > ob.bottom) {

                        ob.use = true;

                        break;

                    }

                }

            }

             //===========================================================//
             // BREAK + UPDATE
             //===========================================================//

            else if (
                ob.break &&
                ob.update
            ) {

                ob.top = ob.base.high;
                ob.bottom = ob.base.open;

                //=======================================================//
                // CHECK USE
                //=======================================================//

                for (
                    let x = filteredCandles.findIndex(
                        (candle) => candle.index === ob.break.index
                    ) + 1;

                    x < filteredCandles.length;

                    x++
                ) {

                    if (filteredCandles[x].high > ob.bottom) {

                        ob.use = true;

                        break;

                    }

                }

            }

        }

        //===============================================================//
        //                    NO BASE = STOP                             //
        //===============================================================//

        if (!ob.base) {
            break;
        }

        //===============================================================//
        //                         OB INDEX                              //
        //===============================================================//

        ob.index = ob.base.index;

        //===============================================================//
        //                         SAVE OB                               //
        //===============================================================//

        obs.push(ob);

        //===============================================================//
        //                   MOVE TO NEXT OB                             //
        //===============================================================//

        if (!ob.break) {
            break;
        }

        // مهم:
        // جستجوی OB بعدی از candle بعد از break شروع می‌شود.
        startIndex = ob.break.index + 1;
    }

    return obs;
}