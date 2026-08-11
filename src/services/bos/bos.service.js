import MinuteCandle from "@/models/minute-candle.model";
import MinuteChoch from "@/models/minute-choch.model";
import TempBos from "@/models/temp-bos.model";
import Bos from "@/models/bos.model";


//=======================================================================//
//                             DETECT BOS                                //
//=======================================================================//

export async function detectBos(fromIndex = 0) {

    const {bearishBOS, bullishBOS} = await getOrCreateTempBos();


    const candles = await MinuteCandle
        .find({
            index: {$gt: fromIndex},
        })
        .sort({index: 1})
        .lean();


    for (const candle of candles) {

        await bosDetector(candle, bearishBOS, bullishBOS);

    }


    return candles;

}
//=======================================================================//
//                            BOS DETECTOR                               //
//=======================================================================//

export async function bosDetector(candle, bearishBOS, bullishBOS) {

    //===================================================================//
    //                         FIND BOS OPEN                             //
    //===================================================================//

    if (bearishBOS.open === null && bullishBOS.open === null) {

        const chochs = await MinuteChoch
            .find({})
            .sort({index: 1})
            .limit(2)
            .lean();


        if (chochs.length < 2) {
            return null;
        }


        const [firstChoch, secondChoch] = chochs;


        if (secondChoch.break !== null) {

            bullishBOS.open = firstChoch.max;

            bearishBOS.open = secondChoch.min;

        } else {

            bearishBOS.open = secondChoch.min;

        }


        if (secondChoch.bullishCh && secondChoch.bullishCh.index < candle.index) {
            return null;
        }

    }

    //=======================================================================//
    //                         FIND BULLISH BOS OPEN                         //
    //=======================================================================//

    if (bearishBOS.open !== null && bullishBOS.open === null) {

        //-------------------------------------------------------------------//
        //                         FIND LAST BOS                              //
        //-------------------------------------------------------------------//

        const lastBos = await Bos
            .findOne({
                "close.index": {
                    $exists: true,
                },
            })
            .sort({
                "close.index": -1,
            })
            .lean();


        const startIndex = lastBos?.close?.index ?? bearishBOS.open.index;


        //-------------------------------------------------------------------//
        //                    FIND MAXIMUM OF HIGHS                           //
        //-------------------------------------------------------------------//

        const candles = await MinuteCandle
            .find({
                index: {
                    $gte: startIndex, $lte: candle.index,
                },
            })
            .sort({
                index: 1,
            })
            .lean();


        let maxHighCandle = null;


        for (const currentCandle of candles) {

            if (!maxHighCandle || currentCandle.high > maxHighCandle.high) {
                maxHighCandle = currentCandle;
            }

        }


        if (!maxHighCandle) {
            return null;
        }


        //-------------------------------------------------------------------//
        //                         CALCULATE 50%                              //
        //-------------------------------------------------------------------//

        const minLow = bearishBOS.open.low;


        bullishBOS.percents50 = ((maxHighCandle.high - minLow) / 2) + minLow;


        //-------------------------------------------------------------------//
        //                     FIND BULLISH BOS OPEN                          //
        //-------------------------------------------------------------------//

        if (bullishBOS.percents50 >= candle.low && maxHighCandle.index !== candle.index) {

            bullishBOS.open = maxHighCandle;

            bullishBOS.standard = true;

        } else {

            //-----------------------------------------------------------------//
            //                       FIND BEARISH CHOCH                        //
            //-----------------------------------------------------------------//

            const bearishChoch = await MinuteChoch.findOne({
                "bearishCh.index": candle.index,
            });


            if (bearishChoch?.max) {

                bullishBOS.open = bearishChoch.max;

            }

        }

    }

    //=======================================================================//
    //                         FIND BEARISH BOS OPEN                         //
    //=======================================================================//

    if (bearishBOS.open === null && bullishBOS.open !== null) {

        //-------------------------------------------------------------------//
        //                         FIND LAST BOS                              //
        //-------------------------------------------------------------------//

        const lastBos = await Bos
            .findOne({
                "close.index": {
                    $exists: true,
                },
            })
            .sort({
                "close.index": -1,
            })
            .lean();


        const startIndex = lastBos?.close?.index ?? bullishBOS.open.index;


        //-------------------------------------------------------------------//
        //                    FIND MINIMUM OF LOWS                            //
        //-------------------------------------------------------------------//

        const candles = await MinuteCandle
            .find({
                index: {
                    $gte: startIndex, $lte: candle.index,
                },
            })
            .sort({
                index: 1,
            })
            .lean();


        let minLowCandle = null;


        for (const currentCandle of candles) {

            if (!minLowCandle || currentCandle.low < minLowCandle.low) {
                minLowCandle = currentCandle;
            }

        }


        if (!minLowCandle) {
            return null;
        }


        //-------------------------------------------------------------------//
        //                         CALCULATE 50%                              //
        //-------------------------------------------------------------------//

        const maxHigh = bullishBOS.open.high;


        bearishBOS.percents50 = ((maxHigh - minLowCandle.low) / 2) + minLowCandle.low;


        //-------------------------------------------------------------------//
        //                     FIND BEARISH BOS OPEN                          //
        //-------------------------------------------------------------------//

        if (bearishBOS.percents50 <= candle.high && minLowCandle.index !== candle.index) {

            bearishBOS.open = minLowCandle;

            bearishBOS.standard = true;

        } else {

            //-----------------------------------------------------------------//
            //                       FIND BULLISH CHOCH                        //
            //-----------------------------------------------------------------//

            const bullishChoch = await MinuteChoch.findOne({
                "bullishCh.index": candle.index,
            });


            if (bullishChoch?.min) {

                bearishBOS.open = bullishChoch.min;

            }

        }

    }

    //=======================================================================//
    //                         UPDATE BOS STANDARD                           //
    //=======================================================================//

    if (bearishBOS.open !== null && bullishBOS.open !== null) {

        //-------------------------------------------------------------------//
        //                    BULLISH BOS IS NEWER                            //
        //-------------------------------------------------------------------//

        if (bullishBOS.open.index > bearishBOS.open.index) {

            if (bullishBOS.standard === false) {

                const candles = await MinuteCandle
                    .find({
                        index: {
                            $gte: bearishBOS.open.index, $lte: candle.index,
                        },
                    })
                    .sort({
                        index: 1,
                    })
                    .lean();


                let maxHighCandle = null;


                //----------------------------------------------------------------//
                //                     FIND MAXIMUM OF HIGHS                     //
                //----------------------------------------------------------------//

                for (const currentCandle of candles) {

                    if (!maxHighCandle || currentCandle.high > maxHighCandle.high) {
                        maxHighCandle = currentCandle;
                    }

                }


                if (maxHighCandle) {

                    const minLow = bearishBOS.open.low;

                    bullishBOS.percents50 = ((maxHighCandle.high - minLow) / 2) + minLow;


                    if (bullishBOS.percents50 >= candle.low) {
                        bullishBOS.standard = true;
                    }

                }

            }

            //-------------------------------------------------------------------//
            //                    BEARISH BOS IS NEWER                            //
            //-------------------------------------------------------------------//

        } else if (bullishBOS.open.index < bearishBOS.open.index) {

            if (bearishBOS.standard === false) {

                const candles = await MinuteCandle
                    .find({
                        index: {
                            $gte: bullishBOS.open.index, $lte: candle.index,
                        },
                    })
                    .sort({
                        index: 1,
                    })
                    .lean();


                let minLowCandle = null;


                //----------------------------------------------------------------//
                //                     FIND MINIMUM OF LOWS                     //
                //----------------------------------------------------------------//

                for (const currentCandle of candles) {

                    if (!minLowCandle || currentCandle.low < minLowCandle.low) {
                        minLowCandle = currentCandle;
                    }

                }


                if (minLowCandle) {

                    const maxHigh = bullishBOS.open.high;

                    bearishBOS.percents50 = ((maxHigh - minLowCandle.low) / 2) + minLowCandle.low;


                    if (bearishBOS.percents50 <= candle.high) {
                        bearishBOS.standard = true;
                    }

                }

            }

        }

        //=======================================================================//
        //                         FIND BEARISH BOS CLOSE                        //
        //=======================================================================//

        if (bearishBOS.update) {

            if (bearishBOS.update.low > candle.low) {

                if (bearishBOS.update.low > candle.close) {

                    await closeBearishBOS(
                        candle,
                        bearishBOS,
                        bullishBOS
                    );

                } else {

                    bearishBOS.update = candle;

                }

            }

        } else {

            if (bearishBOS.open.low > candle.low) {

                if (bearishBOS.open.low > candle.close) {

                    await closeBearishBOS(
                        candle,
                        bearishBOS,
                        bullishBOS
                    );

                } else {

                    bearishBOS.update = candle;

                }

            }

        }

        //=======================================================================//
        //                         CLOSE BULLISH BOS                             //
        //=======================================================================//

        if (bullishBOS.update) {

            if (bullishBOS.update.high < candle.high) {

                if (bullishBOS.update.high < candle.close) {

                    await closeBullishBOS(
                        candle,
                        bullishBOS,
                        bearishBOS
                    );

                } else {

                    bullishBOS.update = candle;

                }

            }

        } else {

            if (bullishBOS.open.high < candle.high) {

                if (bullishBOS.open.high < candle.close) {

                    await closeBullishBOS(
                        candle,
                        bullishBOS,
                        bearishBOS
                    );

                } else {

                    bullishBOS.update = candle;

                }

            }

        }

    }


}

//=======================================================================//
//                         GET OR CREATE TEMP BOS                        //
//=======================================================================//

async function getOrCreateTempBos() {

    let bearishBOS = await TempBos.findOne({
        name: "bearishBOS",
    });


    if (!bearishBOS) {

        bearishBOS = await TempBos.create({

            name: "bearishBOS",

            type: "bearish",

            open: null, update: null, close: null,

            min: null, max: null,

            percents50: 0,

            standard: true,

            return: false,

            isMatched: false,

            from: null, to: null,
        });

        console.log("🟥 Bearish BOS record created.");
    }


    let bullishBOS = await TempBos.findOne({
        name: "bullishBOS",
    });


    if (!bullishBOS) {

        bullishBOS = await TempBos.create({

            name: "bullishBOS",

            type: "bullish",

            open: null, update: null, close: null,

            min: null, max: null,

            percents50: 0,

            standard: true,

            return: false,

            isMatched: false,

            from: null, to: null,
        });

        console.log("🟩 Bullish BOS record created.");
    }


    return {
        bearishBOS, bullishBOS,
    };
}


//=======================================================================//
//                       CLOSE BEARISH BOS                              //
//=======================================================================//

async function closeBearishBOS(candle, bearishBOS, bullishBOS) {

    bearishBOS.close = candle;


    //-------------------------------------------------------------------//
    //                       FIND MAXIMUM                                //
    //-------------------------------------------------------------------//

    const candles = await MinuteCandle
        .find({
            index: {
                $gte: bearishBOS.open.index + 1, $lte: candle.index,
            },
        })
        .sort({
            index: 1,
        })
        .lean();


    let maxHighCandle = null;


    for (const currentCandle of candles) {

        if (!maxHighCandle || currentCandle.high > maxHighCandle.high) {
            maxHighCandle = currentCandle;
        }

    }


    if (maxHighCandle) {
        bearishBOS.max = maxHighCandle;
    }


    //-------------------------------------------------------------------//
    //            SET MIN (bearish structure's min = its open)           //
    //-------------------------------------------------------------------//
    // bearishBOS.open از ابتدا همون نقطه‌ی min ساختار bearish هست (همون
    // چیزی که برای محاسبه‌ی percents50 هم به‌عنوان minLow استفاده می‌شه).

    if (!bearishBOS.min) {
        bearishBOS.min = bearishBOS.open;
    }


    //-------------------------------------------------------------------//
    //                    SET START / END TIME                           //
    //-------------------------------------------------------------------//

    bearishBOS.startTime = bearishBOS.open.time;
    bearishBOS.endTime = bearishBOS.close.time;


    //-------------------------------------------------------------------//
    //                  FIND RETURN & STANDARD BOS                       //
    //-------------------------------------------------------------------//

    const lastBos = await Bos
        .findOne()
        .sort({
            "close.index": -1,
        })
        .lean();


    if (lastBos?.type === "bullish") {

        if (lastBos.standard === true || lastBos.return === true) {
            bearishBOS.standard = true;
        }

        bearishBOS.return = true;

    }


    //-------------------------------------------------------------------//
    //                         CREATE BOS                                //
    //-------------------------------------------------------------------//

    const bosData = {
        index: bearishBOS.close.index,

        type: bearishBOS.type,

        open: bearishBOS.open,

        update: bearishBOS.update,

        close: bearishBOS.close,

        min: bearishBOS.min,

        max: bearishBOS.max,

        percents50: bearishBOS.percents50,

        standard: bearishBOS.standard,

        return: bearishBOS.return,

        isMatched: bearishBOS.isMatched,

        startTime: bearishBOS.startTime,

        endTime: bearishBOS.endTime,
    };


    const bos = await Bos.create(bosData);


    //-------------------------------------------------------------------//
    //                    PREPARE NEXT BULLISH BOS                      //
    //-------------------------------------------------------------------//

    bullishBOS.open = bearishBOS.max;


    await resetBOS(bearishBOS, "bearish");


    if (bullishBOS.update) {
        bullishBOS.update = null;
    }


    return bos;

}


//=======================================================================//
//                       CLOSE BULLISH BOS                              //
//=======================================================================//

async function closeBullishBOS(candle, bullishBOS, bearishBOS) {

    bullishBOS.close = candle;


    //-------------------------------------------------------------------//
    //                       FIND MINIMUM                                //
    //-------------------------------------------------------------------//

    const candles = await MinuteCandle
        .find({
            index: {
                $gte: bullishBOS.open.index + 1, $lte: candle.index,
            },
        })
        .sort({
            index: 1,
        })
        .lean();


    let minLowCandle = null;


    for (const currentCandle of candles) {

        if (!minLowCandle || currentCandle.low < minLowCandle.low) {
            minLowCandle = currentCandle;
        }

    }


    if (minLowCandle) {
        bullishBOS.min = minLowCandle;
    }


    //-------------------------------------------------------------------//
    //            SET MAX (bullish structure's max = its open)           //
    //-------------------------------------------------------------------//
    // bullishBOS.open از ابتدا همون نقطه‌ی max ساختار bullish هست (همون
    // چیزی که برای محاسبه‌ی percents50 هم به‌عنوان maxHigh استفاده می‌شه).

    if (!bullishBOS.max) {
        bullishBOS.max = bullishBOS.open;
    }


    //-------------------------------------------------------------------//
    //                    SET START / END TIME                           //
    //-------------------------------------------------------------------//

    bullishBOS.startTime = bullishBOS.open.time;
    bullishBOS.endTime = bullishBOS.close.time;


    //-------------------------------------------------------------------//
    //                  FIND RETURN & STANDARD BOS                       //
    //-------------------------------------------------------------------//

    const lastBos = await Bos
        .findOne()
        .sort({
            "close.index": -1,
        })
        .lean();


    if (lastBos?.type === "bearish") {

        if (lastBos.standard === true || lastBos.return === true) {
            bullishBOS.standard = true;
        }

        bullishBOS.return = true;

    }


    //-------------------------------------------------------------------//
    //                         CREATE BOS                                //
    //-------------------------------------------------------------------//

    const bosData = {
        index: bullishBOS.close.index,

        type: bullishBOS.type,

        open: bullishBOS.open,

        update: bullishBOS.update,

        close: bullishBOS.close,

        min: bullishBOS.min,

        max: bullishBOS.max,

        percents50: bullishBOS.percents50,

        standard: bullishBOS.standard,

        return: bullishBOS.return,

        isMatched: bullishBOS.isMatched,

        startTime: bullishBOS.startTime,

        endTime: bullishBOS.endTime,
    };


    const bos = await Bos.create(bosData);


    //-------------------------------------------------------------------//
    //                    PREPARE NEXT BEARISH BOS                      //
    //-------------------------------------------------------------------//

    bearishBOS.open = bullishBOS.min;


    await resetBOS(bullishBOS, "bullish");


    if (bearishBOS.update) {
        bearishBOS.update = null;
    }


    return bos;

}


//=======================================================================//
//                              RESET BOS                                //
//=======================================================================//

async function resetBOS(bos, type) {

    try {

        bos.type = type;

        bos.open = null;
        bos.update = null;
        bos.close = null;

        bos.min = null;
        bos.max = null;

        bos.percents50 = 0;

        bos.standard = true;
        bos.return = false;
        bos.isMatched = false;

        bos.startTime = null;
        bos.endTime = null;


        return await bos.save();

    } catch (error) {

        throw new Error(`Error resetting BOS model: ${error.message}`);

    }

}