export function formatCandleTimeCompact(timeValue) {

    const timestamp =
        typeof timeValue === "number" &&
        timeValue.toString().length === 10
            ? timeValue * 1000
            : timeValue;


    const date = new Date(timestamp);


    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");


    return `${y}-${m}-${d} ${h}:${min}`;
}



export function transformCandles(
    allCandles,
    lastIndex = 0
) {

    const keys = [
        "o",
        "h",
        "l",
        "c",
        "v",
        "t"
    ];


    const length = allCandles.t.length;


    if (
        !keys.every(
            key =>
                allCandles[key] &&
                allCandles[key].length === length
        )
    ) {
        return [];
    }


    return allCandles.t.map(
        (timestamp, index) => ({
            index:
                lastIndex
                    ? index + lastIndex + 1
                    : index,

            open: allCandles.o[index],
            high: allCandles.h[index],
            low: allCandles.l[index],
            close: allCandles.c[index],
            value: allCandles.v[index],
            time: timestamp,

            formattedTime:
                formatCandleTimeCompact(timestamp)
        })
    );
}



export function convertOneMinToFifteen(time) {

    return time - (time % 900);

}