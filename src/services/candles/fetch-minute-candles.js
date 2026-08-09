import axios from "axios";

import farazConfig from "@/lib/faraz";

import {transformCandles} from "@/utils/candle-time";


export default async function fetchMinuteCandles({

                                                     symbol = farazConfig.symbol,

                                                     countback = 1440,

                                                     beginTime = Math.floor(Date.now() / 1000) - 1,

                                                     lastIndex = 0,

                                                 } = {}) {


    const now = Math.floor(Date.now() / 1000);


    const url = `${farazConfig.url}?symbolName=${symbol}&resolution=1&from=${beginTime}&to=${now}&countback=${countback}&firstDataRequest=true&latest=true&adjustType=2&json=true`;


    const response = await axios.get(url, {
        headers: farazConfig.headers, withCredentials: true
    });


    return transformCandles(response.data.result, lastIndex);


}