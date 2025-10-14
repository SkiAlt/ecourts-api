// controllers/api.controller.js

const ecourtsService = require('../services/ecourts.service');

// Generic success and error response functions
const handleSuccess = (res, data, message) => {
    res.json({ success: true, data, message });
};

const handleError = (res, error, defaultMessage = 'An error occurred') => {
    console.error(`❌ API Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message || defaultMessage });
};

// --- Controller Functions ---

exports.getHealth = (req, res) => {
    const healthStatus = ecourtsService.getHealth();
    res.json(healthStatus);
};

exports.initialize = async (req, res) => {
    try {
        const { courtType = 'DC', deviceUuid = '324456' } = req.body;
        console.log('🚀 Initializing eCourts API...');
        const result = await ecourtsService.initialize(courtType, deviceUuid);
        res.json({ success: true, message: 'API initialized successfully', token: result.token ? result.token.substring(0, 20) + '...' : '' });
    } catch (error) {
        handleError(res, error, 'Initialization failed');
    }
};

exports.setToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'token is required' });
        const result = ecourtsService.setToken(token);
        res.json({ success: true, message: 'JWT token set successfully', token: result.token ? result.token.substring(0, 20) + '...' : '' });
    } catch (error) {
        handleError(res, error, 'Failed to set token');
    }
};

exports.getStates = async (req, res) => {
    try {
        const { courtType = 'DC' } = req.query;
        const response = await ecourtsService.getStates(courtType);
        if (response && response.states) {
            handleSuccess(res, response.states, 'States retrieved successfully');
        } else {
            res.json({ success: false, error: 'No states data found', response });
        }
    } catch (error) {
        handleError(res, error, 'Failed to retrieve states');
    }
};

exports.getDistricts = async (req, res) => {
    try {
        const { stateCode, courtType = 'DC' } = req.body;
        if (!stateCode) return res.status(400).json({ success: false, error: 'stateCode is required' });
        const response = await ecourtsService.getDistricts(stateCode, courtType);
        if (response && response.districts) {
            handleSuccess(res, response.districts, 'Districts retrieved successfully');
        } else {
            res.json({ success: false, error: 'No districts data found', response });
        }
    } catch (error) {
        handleError(res, error, 'Failed to retrieve districts');
    }
};

exports.getCourts = async (req, res) => {
    try {
        const { stateCode, districtCode, courtType = 'DC' } = req.body;
        if (!stateCode || !districtCode) return res.status(400).json({ success: false, error: 'stateCode and districtCode are required' });
        const response = await ecourtsService.getCourts(stateCode, districtCode, courtType);
        if (response && response.courtComplex) {
            handleSuccess(res, response.courtComplex, 'Courts retrieved successfully');
        } else {
            res.json({ success: false, error: 'No courts data found', response });
        }
    } catch (error) {
        handleError(res, error, 'Failed to retrieve courts');
    }
};

exports.getEstablishments = async (req, res) => {
    try {
        const { stateCode, districtCode, complexCode, courtType = 'DC' } = req.body;
        if (!stateCode || !districtCode || !complexCode) return res.status(400).json({ success: false, error: 'stateCode, districtCode, and complexCode are required' });
        const establishments = await ecourtsService.getEstablishments(stateCode, districtCode, complexCode, courtType);
        handleSuccess(res, establishments, 'Establishments retrieved successfully');
    } catch (error) {
        handleError(res, error, 'Failed to retrieve establishments');
    }
};

exports.getCaseTypes = async (req, res) => {
    try {
        const { stateCode, districtCode, courtCode, courtType = 'DC' } = req.body;
        if (!stateCode || !districtCode || !courtCode) return res.status(400).json({ success: false, error: 'stateCode, districtCode, and courtCode are required' });
        const response = await ecourtsService.getCaseTypes(stateCode, districtCode, courtCode, courtType);
        if (response && response.case_types) {
             const parsedCaseTypes = [];
             response.case_types.forEach(item => {
                 if (item.case_type) {
                     item.case_type.split('#').forEach(group => {
                         const parts = group.split('~');
                         if (parts.length === 2) {
                             parsedCaseTypes.push({ code: parts[0], name: parts[1] });
                         }
                     });
                 }
             });
            handleSuccess(res, parsedCaseTypes, 'Case types retrieved successfully');
        } else {
            res.json({ success: false, error: 'No case types data found', response });
        }
    } catch (error) {
        handleError(res, error, 'Failed to retrieve case types');
    }
};

exports.searchByCaseNumber = async (req, res) => {
    try {
        const required = ['caseNumber', 'caseType', 'year', 'stateCode', 'districtCode', 'courtCodes'];
        if (required.some(field => !req.body[field])) return res.status(400).json({ success: false, error: 'Missing one or more required fields.' });
        const response = await ecourtsService.searchByCaseNumber(req.body);
        handleSuccess(res, response, 'Case search completed');
    } catch (error) {
        handleError(res, error, 'Case search failed');
    }
};

exports.searchByCnr = async (req, res) => {
    try {
        const { cnr, courtType = 'DC' } = req.body;
        if (!cnr) return res.status(400).json({ success: false, error: 'CNR is required' });
        const response = await ecourtsService.searchByCnr(cnr, courtType);
        handleSuccess(res, response, 'CNR search completed');
    } catch (error) {
        handleError(res, error, 'CNR search failed');
    }
};

exports.getCaseHistory = async (req, res) => {
    try {
        const { cnr, courtType = 'DC' } = req.body;
        if (!cnr) return res.status(400).json({ success: false, error: 'CNR is required' });
        const response = await ecourtsService.getCaseHistory(cnr, courtType);
        handleSuccess(res, response, 'Case history retrieved successfully');
    } catch (error) {
        handleError(res, error, 'Failed to retrieve case history');
    }
};

exports.getCauseList = async (req, res) => {
    try {
        const required = ['stateCode', 'districtCode', 'courtCode', 'courtNo', 'causelistDate'];
        if (required.some(field => !req.body[field])) return res.status(400).json({ success: false, error: 'Missing one or more required fields.' });
        const response = await ecourtsService.getCauseList(req.body);
        handleSuccess(res, response, 'Cause list retrieved successfully');
    } catch (error) {
        handleError(res, error, 'Failed to retrieve cause list');
    }
};