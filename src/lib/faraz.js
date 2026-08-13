const {
    FARAZ_URL,
    FARAZ_SYMBOL,
    FARAZ_SESSION,
    FARAZ_X_ACCESS_TOKEN,
    FARAZ_LOGIN_STORE,
} = process.env;

const farazConfig = {
    url: FARAZ_URL,
    symbol: FARAZ_SYMBOL,

    headers: {
        Host: "faraz.io",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*",
        Connection: "keep-alive",
        Cookie: `farazSession=${FARAZ_SESSION}; x-access-token=${FARAZ_X_ACCESS_TOKEN} ; faraz-login-store=${FARAZ_LOGIN_STORE}`,
    },
};

export default farazConfig;