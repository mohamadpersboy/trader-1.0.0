export function formatPrice(value) {

    if (value === null || value === undefined) {
        return "—";
    }

    return Number(value).toFixed(6);

}


export function formatTime(candleLike) {

    if (!candleLike) {
        return "—";
    }

    return candleLike.formattedTime ?? "—";

}
