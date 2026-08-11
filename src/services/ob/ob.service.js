export default function detectOB(type, candles, fvgs) {

    const length = candles.length;
    const obs = [];
    const ob = {index: 0, base: null, update: null, break: null, top: 0, bottom: 0, use: null, fvgs: []};

    let i = candles[0].index;

    while (i < candles[length - 1].index) {

        if (type === 'bullish') {

            ob.base = candles.reduce((lowestCandle, candle) => {

                if (candle.low < lowestCandle.low) {

                    if (candle.close >= candle.open) return lowestCandle;

                }

                if (!lowestCandle) return candle;

            }, null);

            if (ob.base) {

                for (let k = ob.base.index + 1; k < candles[length - 1].index; k++) {

                    if (ob.update) {

                        if (candles[k].high > ob.update.high) {

                            if (candles[k].close > ob.update.high) {
                                ob.break = candles[k];
                                break;
                            } else {
                                ob.update = candles[k];
                            }

                        }
                    } else {

                        if (candles[k].high > ob.base.high) {

                            if (candles[k].close > ob.base.high) {
                                ob.break = candles[k];
                                break;
                            } else {
                                ob.update = candles[k];
                            }

                        }

                    }

                }

            }

            if (ob.break && ob.update === null && fvgs.length !== 0) {

                const nextFVGs = fvgs.filter(fvg => fvg.index >= ob.break.index);

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

                for (let x = close.index + 1; x < candles.length; x++) {

                    if (candles[x].low < ob.top) {
                        ob.use = true;
                        break;
                    }

                }

            } else if (ob.break && ob.update) {

                ob.top = ob.base.open;
                ob.bottom = ob.base.low;

                for (let x = close.index + 1; x < candles.length; x++) {

                    if (candles[x].low < ob.top) {
                        ob.use = true;
                        break;
                    }

                }

            }

            if (ob.break) i = ob.break.index + 1;

            obs.push(ob);

            ob.index = 0;
            ob.base = ob.update = ob.break = null;
            ob.use = false;
            ob.top = ob.bottom = 0;

        } else {

            ob.base = candles.reduce((highestCandle, candle) => {

                if (candle.high > highestCandle.high) {

                    if (candle.close <= candle.open) return highestCandle;

                }

                if (!highestCandle) return candle;

            }, null);

            if (ob.base) {

                for (let k = ob.base.index + 1; k < candles[length - 1].index; k++) {

                    if (ob.update) {

                        if (candles[k].low < ob.update.low) {

                            if (candles[k].close < ob.update.low) {
                                ob.break = candles[k];
                                break;
                            } else {
                                ob.update = candles[k];
                            }

                        }
                    } else {

                        if (candles[k].low < ob.base.low) {

                            if (candles[k].close < ob.base.low) {
                                ob.break = candles[k];
                                break;
                            } else {
                                ob.update = candles[k];
                            }

                        }

                    }

                }

            }

            if (ob.break && ob.update === null && fvgs.length !== 0) {

                const nextFVGs = fvgs.filter(fvg => fvg.index >= ob.break.index);

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

                for (let x = close.index + 1; x < candles.length; x++) {

                    if (candles[x].high > ob.bottom) {
                        ob.use = true;
                        break;
                    }

                }

            } else if (ob.break && ob.update) {

                for (let x = close.index + 1; x < candles.length; x++) {

                    if (candles[x].high > ob.base.open) {
                        ob.top = ob.base.high;
                        ob.bottom = ob.base.open;
                    }

                }
            }

            if (ob.break) i = ob.break.index;

            obs.push(ob);

            ob.index = 0;
            ob.base = ob.update = ob.break = null;
            ob.use = false;
            ob.fvgs = [];

        }

    }

    return obs;

}

function findBase(candles) {
    if (!candles || candles.length === 0) return null;

    let lowestIndex = 0;
    for (let i = 1; i < candles.length; i++) {
        if (candles[i].low < candles[lowestIndex].low) {
            lowestIndex = i;
        }
    }

    const lowestCandle = candles[lowestIndex];
    const isBearish = (c) => c.close < c.open;


    if (isBearish(lowestCandle)) {
        return lowestCandle;
    }


    let result = null;
    for (let i = lowestIndex + 1; i < candles.length; i++) {
        const candle = candles[i];
        if (!isBearish(candle)) continue;
        if (!result || candle.low < result.low) {
            result = candle;
        }
    }

    return result;
}
