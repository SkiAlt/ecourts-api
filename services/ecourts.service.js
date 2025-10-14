// services/ecourts.service.js

const axios = require('axios');
const CryptoJS = require('crypto-js');
const { ECOURTS_CONFIG, SESSION_TIMEOUT } = require('../config/ecourts.config');
const { shuffle, genRanHex } = require('../utils/helpers');

// Global session state managed by the service
let state = {
    globalIv: "4B6250655368566D",
    globalIndex: 0,
    sessionCookies: '',
    jwttoken: "",
    sessionInitialized: false,
    lastSessionTime: 0,
};

// --- Private Helper Functions ---

function generateGlobalIv() {
    const testArr = [0, 1, 2, 3, 4, 5];
    shuffle(testArr);
    state.globalIv = ECOURTS_CONFIG.ivArray[testArr[0]];
    state.globalIndex = testArr[0];
}

function encryptData(data) {
    const dataEncoded = JSON.stringify(data);
    generateGlobalIv();
    const randomIv = genRanHex(16);
    const key = CryptoJS.enc.Hex.parse(ECOURTS_CONFIG.encryptKey);
    const iv = CryptoJS.enc.Hex.parse(state.globalIv + randomIv);
    const encrypted = CryptoJS.AES.encrypt(dataEncoded, key, { iv: iv });
    const encryptedDataBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    return randomIv + String(state.globalIndex) + encryptedDataBase64;
}

function decryptResponse(resultString) {
    const key = CryptoJS.enc.Hex.parse(ECOURTS_CONFIG.decryptKey);
    const s = resultString.trim();

    try {
        const possibleIvHex = s.slice(0, 32);
        const rest = s.slice(32);
        const iv = CryptoJS.enc.Hex.parse(possibleIvHex);
        const bytes = CryptoJS.AES.decrypt(rest.trim(), key, { iv: iv });
        const dec = bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u0019]+/g, "");
        if (dec) return JSON.parse(dec);
    } catch (e) {}

    try {
        const randomIv = s.slice(0, 16);
        const idx = s.slice(16, 17);
        const rest = s.slice(17);
        const ivHex = (ECOURTS_CONFIG.ivArray[parseInt(idx, 10)] || state.globalIv) + randomIv;
        const iv = CryptoJS.enc.Hex.parse(ivHex);
        const bytes = CryptoJS.AES.decrypt(rest.trim(), key, { iv: iv });
        const dec = bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u0019]+/g, "");
        if (dec) return JSON.parse(dec);
    } catch (e) {}

    return s;
}

async function callToWebService(url, data, useAuth = false) {
    console.log('🌐 Calling:', url.split('/').pop());
    const data1 = encryptData(data);
    let headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        'Accept': '*/*'
    };

    if (state.sessionCookies) {
        headers['Cookie'] = state.sessionCookies;
    }

    if (useAuth && state.jwttoken) {
        headers['Authorization'] = 'Bearer ' + encryptData(state.jwttoken);
    }

    try {
        const response = await axios.get(url, {
            params: { params: data1 },
            headers: headers
        });

        if (response.headers['set-cookie']) {
            state.sessionCookies = response.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
            console.log('🍪 Session cookies updated');
        }

        let responseDecoded = typeof response.data === 'string' ? decryptResponse(response.data) : response.data;
        
        if (responseDecoded && responseDecoded.token) {
            state.jwttoken = responseDecoded.token;
            console.log('🎉 JWT token extracted');
        }

        return responseDecoded;
    } catch (error) {
        console.error(`❌ Error calling ${url.split('/').pop()}:`, error.message);
        throw error;
    }
}

async function ensureValidSession(courtType = 'DC') {
    const now = Date.now();
    if (!state.sessionInitialized || !state.jwttoken || (now - state.lastSessionTime) > SESSION_TIMEOUT) {
        console.log('🔄 Session expired or not initialized, reinitializing...');
        try {
            // Step 1: Initialize session
            const initUrl = ECOURTS_CONFIG.baseUrls[courtType] + "appReleaseWebService.php";
            await callToWebService(initUrl, { version: "3.0", uid: "324456:in.gov.ecourts.eCourtsServices" }, false);

            // Step 2: Get states to establish JWT token
            const statesUrl = ECOURTS_CONFIG.baseUrls[courtType] + "stateWebService.php";
            await callToWebService(statesUrl, { action_code: "fillState", time: (new Date().getTime() / 1000).toString(), uid: "324456:in.gov.ecourts.eCourtsServices" }, true);

            state.sessionInitialized = true;
            state.lastSessionTime = now;
            console.log('✅ Session reinitialized successfully');
        } catch (error) {
            console.error('❌ Failed to reinitialize session:', error.message);
            throw error;
        }
    }
}

// --- Public Service Functions ---

const getHealth = () => ({
    success: true,
    message: 'eCourts API is running',
    timestamp: new Date().toISOString(),
    initialized: !!state.jwttoken
});

const initialize = async (courtType, deviceUuid) => {
    const initUrl = ECOURTS_CONFIG.baseUrls[courtType] + "appReleaseWebService.php";
    const initData = {
        version: "3.0",
        uid: `${deviceUuid}:in.gov.ecourts.eCourtsServices`
    };
    await callToWebService(initUrl, initData, false);
    return { token: state.jwttoken };
};

const setToken = (token) => {
    state.jwttoken = token;
    console.log('🎉 JWT token set from client');
    return { token: state.jwttoken };
};

const getStates = async (courtType) => {
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "stateWebService.php";
    const data = {
        action_code: "fillState",
        time: (new Date().getTime() / 1000).toString(),
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    return await callToWebService(url, data, true);
};

const getDistricts = async (stateCode, courtType) => {
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "districtWebService.php";
    const data = {
        action_code: "fillDistrict",
        state_code: stateCode,
        time: (new Date().getTime() / 1000).toString(),
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    return await callToWebService(url, data, true);
};

const getCourts = async (stateCode, districtCode, courtType) => {
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "courtEstWebService.php";
    const data = {
        action_code: "fillCourtComplex",
        state_code: stateCode,
        dist_code: districtCode
    };
    return await callToWebService(url, data, true);
};

const getEstablishments = async (stateCode, districtCode, complexCode, courtType) => {
    const courtsResponse = await getCourts(stateCode, districtCode, courtType);
    if (courtsResponse && courtsResponse.courtComplex) {
        return courtsResponse.courtComplex
            .filter(court => court.complex_code === complexCode)
            .map(court => ({
                establishment_code: court.njdg_est_code,
                complex_code: court.complex_code,
                court_name: court.court_complex_name
            }));
    }
    return [];
};

const getCaseTypes = async (stateCode, districtCode, courtCode, courtType) => {
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "caseNumberWebService.php";
    const establishmentCode = courtCode.split('-')[1] || courtCode;
    const data = {
        state_code: stateCode,
        dist_code: districtCode,
        court_code: establishmentCode,
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    if (courtType === 'DC') {
        data.language_flag = "english";
        data.bilingual_flag = "0";
    }
    return await callToWebService(url, data, true);
};

const searchByCaseNumber = async (searchParams) => {
    const { courtType } = searchParams;
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "caseNumberSearch.php";
    const data = {
        case_number: searchParams.caseNumber,
        case_type: searchParams.caseType,
        year: searchParams.year,
        state_code: searchParams.stateCode,
        dist_code: searchParams.districtCode,
        court_code_arr: Array.isArray(searchParams.courtCodes) ? searchParams.courtCodes.join(',') : searchParams.courtCodes,
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    if (courtType === 'DC') {
        data.language_flag = "english";
        data.bilingual_flag = "0";
    }
    return await callToWebService(url, data, true);
};

const searchByCnr = async (cnr, courtType) => {
    await ensureValidSession(courtType);
    const url = courtType === 'DC' 
        ? ECOURTS_CONFIG.baseUrls[courtType] + "listOfCasesWebService.php"
        : ECOURTS_CONFIG.baseUrls[courtType] + "caseHistoryWebService.php";
    const data = {
        cino: cnr,
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    if (courtType === 'DC') {
        data.language_flag = "english";
        data.bilingual_flag = "0";
        data.version_number = "3.0";
    }
    return await callToWebService(url, data, true);
};

const getCaseHistory = async (cnr, courtType) => {
    await ensureValidSession(courtType);
    const url = ECOURTS_CONFIG.baseUrls[courtType] + "caseHistoryWebService.php";
    const data = {
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    if (courtType === 'DC') {
        data.cinum = cnr;
        data.language_flag = "english";
        data.bilingual_flag = "0";
    } else {
        data.cino = cnr;
    }
    return await callToWebService(url, data, true);
};

const getCauseList = async (searchParams) => {
    const { courtType, causelistDate } = searchParams;
    await ensureValidSession(courtType);
    
    const today = new Date();
    const selectedDate = new Date(causelistDate);
    const daysDiff = Math.ceil((today - selectedDate) / (1000 * 60 * 60 * 24));
    const selprevdays = daysDiff <= 0 ? "1" : "0";

    const url = ECOURTS_CONFIG.baseUrls[courtType] + "cases_new.php";
    const data = {
        state_code: searchParams.stateCode,
        dist_code: searchParams.districtCode,
        flag: searchParams.caseType,
        selprevdays: selprevdays,
        court_no: searchParams.courtNo,
        court_code: searchParams.courtCode,
        causelist_date: causelistDate,
        uid: "324456:in.gov.ecourts.eCourtsServices"
    };
    if (courtType === 'DC') {
        data.language_flag = "english";
        data.bilingual_flag = "0";
    }
    return await callToWebService(url, data, true);
};


module.exports = {
    getHealth,
    initialize,
    setToken,
    getStates,
    getDistricts,
    getCourts,
    getEstablishments,
    getCaseTypes,
    searchByCaseNumber,
    searchByCnr,
    getCaseHistory,
    getCauseList,
};