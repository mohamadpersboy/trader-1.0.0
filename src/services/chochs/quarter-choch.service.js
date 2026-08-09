import QuarterCandle from "@/models/quarter-candle.model";
import QuarterChoch from "@/models/quarter-choch.model";
import TempQuarterChoch from "@/models/temp-quarter-choch.model";


const {primary, secondary} = await getOrCreateTempChoch();

const candles = await QuarterCandle
    .find()
    .sort({index: 1})
    .lean();


for (const candle of candles) {

    await chockDetector(candle, primary, secondary);

}


//=======================================================================//
//                           CHOCH DETECTOR                              //
//=======================================================================//

export async function chockDetector(candle, primary, secondary) {

    if (!primary || !secondary) {
        throw new Error("Primary or Secondary CHOCH data not found.");
    }


    if (candle.index < 1) {
        return null;
    }


    //===================================================================//
    //                  BEARISH -> WAITING BASE                          //
    //===================================================================//

    if (primary.type === "bearish" && primary.base === null) {

        const previousCandle = await QuarterCandle.findOne({
            index: candle.index - 1,
        });


        if (previousCandle?.high >= candle.high) {
            primary.base = previousCandle;
        }


        //----------------------------------------------------------------//
        //                  Find Special Bearish CHOCH                    //
        //----------------------------------------------------------------//

        const choch = await createBearishSpecialChoch(candle, primary);


        if (choch) {
            return choch;
        }

    }


    //===================================================================//
    //                  BEARISH -> WAITING BREAK                         //
    //===================================================================//

    if (primary.type === "bearish" && primary.base !== null && primary.break === null) {

        //----------------------------------------------------------------//
        //                         Find Break                             //
        //----------------------------------------------------------------//

        if (candle.high > primary.base.high) {

            primary.break = candle;

            await primary.save();

        } else {

            //----------------------------------------------------------------//
            //                  Find Special Bearish CHOCH                    //
            //----------------------------------------------------------------//

            const choch = await createBearishSpecialChoch(candle, primary);


            if (choch) {
                return choch;
            }

        }


        //----------------------------------------------------------------//
        //                         Find Primary Min                       //
        //----------------------------------------------------------------//

        if (primary.break !== null) {

            const minLowCandle = await findMinCandle(primary.base.index, primary.break.index);


            if (minLowCandle) {

                if (minLowCandle.low < primary.base.low) {

                    if (minLowCandle.low > primary.break.low) {

                        primary.min = primary.break;
                        primary.breakMin = true;

                    } else {

                        primary.min = minLowCandle;

                    }

                } else {

                    primary.base = null;
                    primary.break = null;

                }

            }

        }

    }


    //===================================================================//
    //              BEARISH -> SECONDARY / FIND CHOCH                   //
    //===================================================================//

    if (primary.type === "bearish" && primary.base !== null && primary.break !== null && primary.min !== null && primary.bearishCh === null) {

        //----------------------------------------------------------------//
        //                     Find Secondary Base                        //
        //----------------------------------------------------------------//

        if (secondary.base === null && primary.break.index < candle.index) {

            const previousCandle = await QuarterCandle.findOne({
                index: candle.index - 1,
            });


            if (previousCandle?.high >= candle.high) {

                secondary.base = previousCandle;
                secondary.type = "bearish";

            }

        }


        //----------------------------------------------------------------//
        //                     Find Secondary Break                       //
        //----------------------------------------------------------------//

        if (secondary.base !== null) {

            if (candle.high > secondary.base.high) {
                secondary.break = candle;
            }


            //----------------------------------------------------------------//
            //                     Find Secondary Min                      //
            //----------------------------------------------------------------//

            if (secondary.break !== null) {

                const minLowCandle = await findMinCandle(secondary.base.index, secondary.break.index);


                if (minLowCandle) {

                    if (minLowCandle.low < secondary.base.low) {

                        if (minLowCandle.low > secondary.break.low) {

                            secondary.min = secondary.break;
                            secondary.breakMin = true;

                        } else {

                            secondary.min = minLowCandle;

                        }

                    } else {

                        secondary.base = null;
                        secondary.break = null;

                    }

                }


                //----------------------------------------------------------------//
                //                 Move Secondary To Primary                  //
                //----------------------------------------------------------------//

                if (secondary.base && secondary.break && secondary.min) {

                    await resetChoch(primary._id, "bearish");


                    primary.base = secondary.base;
                    primary.break = secondary.break;
                    primary.min = secondary.min;


                    await resetChoch(secondary._id, "bearish");

                }

            }

        }


        //----------------------------------------------------------------//
        //                         Find Bearish CH                        //
        //----------------------------------------------------------------//

        if (primary.min !== null && primary.bearishCh === null && primary.min.low > candle.low) {

            primary.bearishCh = candle;


            primary.max = await findMaxCandle(primary.break.index, candle.index, true);


            const choch = await createChochFromPrimary(primary);


            await resetChoch(primary._id, "bullish");


            await resetChoch(secondary._id, "");


            return choch;

        }

    }


    //===================================================================//
    //                   BULLISH -> WAITING BASE                         //
    //===================================================================//

    if (primary.type === "bullish" && primary.base === null) {

        //----------------------------------------------------------------//
        //                         Find Primary Base                      //
        //----------------------------------------------------------------//

        const previousCandle = await QuarterCandle.findOne({
            index: candle.index - 1,
        });


        if (previousCandle?.low <= candle.low) {
            primary.base = previousCandle;
        }


        //----------------------------------------------------------------//
        //                  Find Special Bullish CHOCH                    //
        //----------------------------------------------------------------//

        const choch = await createBullishSpecialChoch(candle, primary);


        if (choch) {
            return choch;
        }

    }


    //===================================================================//
    //                   BULLISH -> WAITING BREAK                        //
    //===================================================================//

    if (primary.type === "bullish" && primary.base !== null && primary.break === null) {

        //----------------------------------------------------------------//
        //                         Find Primary Break                     //
        //----------------------------------------------------------------//

        if (candle.low < primary.base.low) {

            primary.break = candle;

        } else {

            //----------------------------------------------------------------//
            //                  Find Special Bullish CHOCH                   //
            //----------------------------------------------------------------//

            const choch = await createBullishSpecialChoch(candle, primary);


            if (choch) {
                return choch;
            }

        }


        //----------------------------------------------------------------//
        //                         Find Primary Max                       //
        //----------------------------------------------------------------//

        if (primary.break !== null) {

            const maxHighCandle = await findMaxCandle(primary.base.index, primary.break.index);


            if (maxHighCandle) {

                if (maxHighCandle.high > primary.base.high) {

                    if (maxHighCandle.high < primary.break.high) {

                        primary.max = primary.break;
                        primary.breakMax = true;

                    } else {

                        primary.max = maxHighCandle;

                    }

                } else {

                    primary.base = null;
                    primary.break = null;

                }

            }

        }

    }

    //-----------------------------------------------------------------------//
    //              BULLISH -> SECONDARY / FIND CHOCH                       //
    //-----------------------------------------------------------------------//

    if (primary.type === "bullish" && primary.base !== null && primary.break !== null && primary.max !== null && primary.bullishCh === null) {

        //-------------------------------------------------------------------//
        //                     Find Secondary Base                           //
        //-------------------------------------------------------------------//

        if (secondary.base === null && primary.break.index < candle.index) {

            const previousCandle = await QuarterCandle.findOne({
                index: candle.index - 1,
            });


            if (previousCandle?.low <= candle.low) {

                secondary.base = previousCandle;
                secondary.type = "bullish";

            }

        }


        //-------------------------------------------------------------------//
        //                    Find Secondary Break                           //
        //-------------------------------------------------------------------//

        if (secondary.base !== null) {

            if (candle.low < secondary.base.low) {

                secondary.break = candle;

            }


            //----------------------------------------------------------------//
            //                    Find Secondary Max                          //
            //----------------------------------------------------------------//

            if (secondary.break !== null) {

                const candles = await QuarterCandle
                    .find({
                        index: {
                            $gt: secondary.base.index, $lt: secondary.break.index,
                        },
                    })
                    .sort({index: 1})
                    .lean();


                let maxHighCandle = null;


                for (const currentCandle of candles) {

                    if (!maxHighCandle || currentCandle.high > maxHighCandle.high) {

                        maxHighCandle = currentCandle;

                    }

                }


                //----------------------------------------------------------------//
                //       Comparison Secondary Max vs Secondary Base High          //
                //----------------------------------------------------------------//

                if (maxHighCandle && maxHighCandle.high > secondary.base.high) {

                    if (maxHighCandle.high < secondary.break.high) {

                        secondary.max = secondary.break;
                        secondary.breakMax = true;

                    } else {

                        secondary.max = maxHighCandle;

                    }

                } else {

                    secondary.base = null;
                    secondary.break = null;

                }


                //----------------------------------------------------------------//
                //                  Replace Secondary In Primary                //
                //----------------------------------------------------------------//

                if (secondary.base !== null && secondary.break !== null && secondary.max !== null) {

                    await resetChoch(primary._id, "bullish");


                    primary.base = secondary.base;
                    primary.break = secondary.break;
                    primary.max = secondary.max;


                    await resetChoch(secondary._id, "bullish");

                }


            } else if (primary.max.high < candle.high) {

                //----------------------------------------------------------------//
                //                           Find CH                            //
                //----------------------------------------------------------------//

                primary.bullishCh = candle;


                const candles = await QuarterCandle
                    .find({
                        index: {
                            $gte: primary.break.index, $lte: candle.index,
                        },
                    })
                    .sort({index: 1})
                    .lean();


                let minLowCandle = null;


                //----------------------------------------------------------------//
                //                    Find Minimum Of Lows                      //
                //----------------------------------------------------------------//

                for (const currentCandle of candles) {

                    if (!minLowCandle || currentCandle.low < minLowCandle.low) {

                        minLowCandle = currentCandle;

                    }

                }


                if (minLowCandle) {

                    primary.min = minLowCandle;


                    //----------------------------------------------------------------//
                    //                       Create CHOCH                           //
                    //----------------------------------------------------------------//

                    const choch = await createChochFromPrimary(primary);


                    await resetChoch(primary._id, "bearish");


                    await resetChoch(secondary._id, "");


                    return choch;

                }

            }

        }

    }


    return null;
}


//=======================================================================//
//                           FIND MIN CANDLE                             //
//=======================================================================//

async function findMinCandle(fromIndex, toIndex) {

    const candles = await QuarterCandle
        .find({
            index: {
                $gt: fromIndex, $lt: toIndex,
            },
        })
        .sort({index: 1})
        .lean();


    let minCandle = null;


    for (const currentCandle of candles) {

        if (!minCandle || currentCandle.low < minCandle.low) {
            minCandle = currentCandle;
        }

    }


    return minCandle;
}


//=======================================================================//
//                           FIND MAX CANDLE                             //
//=======================================================================//

async function findMaxCandle(fromIndex, toIndex, inclusiveStart = false) {

    const candles = await QuarterCandle
        .find({
            index: {
                $gt: fromIndex, $lt: toIndex,
                // [inclusiveStart ? "$gte" : "$gt"]: fromIndex, $lte: toIndex,
            },
        })
        .sort({index: 1})
        .lean();


    let maxCandle = null;


    for (const currentCandle of candles) {

        if (!maxCandle || currentCandle.high > maxCandle.high) {
            maxCandle = currentCandle;
        }

    }


    return maxCandle;
}


//=======================================================================//
//                     CREATE BEARISH SPECIAL CHOCH                     //
//=======================================================================//

async function createBearishSpecialChoch(candle, primary) {

    const lastChoch = await QuarterChoch
        .findOne()
        .sort({index: -1});


    if (!lastChoch?.min) {
        return null;
    }


    if (lastChoch.min.low <= candle.low) {
        return null;
    }


    const maxHighCandle = await findMaxCandle(lastChoch.bullishCh.index, candle.index, true);


    if (!maxHighCandle) {
        return null;
    }


    primary.base = null;
    primary.bullishCh = lastChoch.bullishCh;
    primary.bearishCh = candle;
    primary.max = maxHighCandle;


    const choch = await createChochFromPrimary(primary);


    await resetChoch(primary._id, "bullish");


    return choch;
}


//=======================================================================//
//                     CREATE BULLISH SPECIAL CHOCH                     //
//=======================================================================//

async function createBullishSpecialChoch(candle, primary) {

    const lastChoch = await QuarterChoch
        .findOne()
        .sort({index: -1});


    if (!lastChoch?.max) {
        return null;
    }


    if (lastChoch.max.high >= candle.high) {
        return null;
    }


    const minLowCandle = await findMinCandle(lastChoch.bearishCh.index, candle.index);


    if (!minLowCandle) {
        return null;
    }


    primary.base = null;
    primary.bearishCh = lastChoch.bearishCh;
    primary.bullishCh = candle;
    primary.min = minLowCandle;


    const choch = await createChochFromPrimary(primary);


    await resetChoch(primary._id, "bearish");


    return choch;
}


//=======================================================================//
//                     CREATE CHOCH FROM PRIMARY                         //
//=======================================================================//

async function createChochFromPrimary(primary) {

    const chochData = {

        type: primary.type,

        base: primary.base,

        break: primary.break,

        min: primary.min,

        max: primary.max,

        bullishCh: primary.bullishCh,

        bearishCh: primary.bearishCh,

        breakMin: primary.breakMin,

        breakMax: primary.breakMax,

    };


    return await QuarterChoch.create(chochData);
}


//=======================================================================//
//                              RESET CHOCH                               //
//=======================================================================//

async function resetChoch(id, type) {

    try {

        return await TempQuarterChoch.findByIdAndUpdate(id, {
            type,

            base: null, break: null,

            min: null, max: null,

            bearishCh: null, bullishCh: null,

            breakMin: false, breakMax: false,
        }, {
            new: true,
        });

    } catch (error) {

        throw new Error(`Error resetting CHOCH model: ${error.message}`);

    }

}


//=======================================================================//
//                       GET OR CREATE TEMP CHOCH                        //
//=======================================================================//

export async function getOrCreateTempChoch() {

    let primary = await TempQuarterChoch.findOne({
        name: "primary",
    });


    if (!primary) {

        primary = await TempQuarterChoch.create({

            name: "primary",

            type: "bearish",

            base: null, break: null,

            min: null, max: null,

            bullishCh: null, bearishCh: null,

            breakMin: false, breakMax: false,

        });


        console.log("🟩 Primary CHOCH record created.");

    }


    let secondary = await TempQuarterChoch.findOne({
        name: "secondary",
    });


    if (!secondary) {

        secondary = await TempQuarterChoch.create({

            name: "secondary",

            type: "",

            base: null, break: null,

            min: null, max: null,

            bullishCh: null, bearishCh: null,

            breakMin: false, breakMax: false,

        });


        console.log("🟨 Secondary CHOCH record created.");

    }


    return {
        primary, secondary,
    };
}
