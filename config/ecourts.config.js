// config/ecourts.config.js

const ECOURTS_CONFIG = {
    baseUrls: {
        DC: "https://app.ecourts.gov.in/ecourt_mobile_DC/",
        HC: "https://app.ecourts.gov.in/ecourt_mobile_HC/"
    },
    encryptKey: '4D6251655468576D5A7134743677397A',
    decryptKey: '3273357638782F413F4428472B4B6250',
    ivArray: [
        "556A586E32723575",
        "34743777217A2543",
        "413F4428472B4B62",
        "48404D635166546A",
        "614E645267556B58",
        "655368566D597133"
    ]
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

module.exports = {
    ECOURTS_CONFIG,
    SESSION_TIMEOUT
};