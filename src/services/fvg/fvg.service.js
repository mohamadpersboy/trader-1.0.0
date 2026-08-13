import QuarterCandle from "@/models/quarter-candle.model";
import { convertOneMinToFifteen } from "@/utils/candle-time";

export default async function detectFVG(bos) {

    const type = bos.type;

    const startTime = convertOneMinToFifteen(
        bos.startTime - 900
    );

    const endTime = convertOneMinToFifteen(
        bos.endTime
    );

    const candles = await QuarterCandle.find({
        time: {
            $gte: startTime,
            $lte: endTime,
        },
    })
        .sort({ time: 1 })
        .lean();

    const fvgs = [];

    const length = candles.length;

    if (length < 3) {
        return fvgs;
    }

    for (let i = 1; i < length - 1; i++) {

        const prev = candles[i - 1];
        const current = candles[i];
        const next = candles[i + 1];

        if (type === "bullish") {

            if (
                current.close > current.open &&
                prev.high < next.low
            ) {

                let use = false;

                for (let j = i + 2; j < length; j++) {
                    if (candles[j].low < next.low) {
                        use = true;
                        break;
                    }
                }

                fvgs.push({
                    type: "bullish",
                    index: current.index,
                    high: next.low,
                    low: prev.high,
                    time: current.time,
                    formattedTime: current.formattedTime,
                    use,
                });
            }

        }

        if(type === 'bearish'){

            if (
                current.close < current.open &&
                prev.low > next.high
            ) {
                let use = false;

                for (let j = i + 2; j < length; j++) {
                    if (candles[j].high > next.high) {
                        use = true;
                        break;
                    }
                }

                fvgs.push({
                    type: "bearish",
                    index: current.index,
                    high: prev.low,
                    low: next.high,
                    time: current.time,
                    formattedTime: current.formattedTime,
                    use,
                });
            }
        }

    }

    return fvgs;
}