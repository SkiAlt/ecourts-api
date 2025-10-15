// lambda/index.js
const axios = require('axios');
const config = require('./config');
const {
    getAllTrackedCases,
    updateCaseStatus,
    sendWhatsAppNotification,
    formatStatusMessage,
    splitIntoBatches
} = require('./utils');

async function initializeEcourtsSession() {
    try {
        const response = await axios.post(`${config.ECOURTS_API.baseUrl}/initialize`);
        if (response.data.success && response.data.token) {
            return response.data.token;
        }
        throw new Error('Failed to initialize eCourts session');
    } catch (error) {
        console.error('Error initializing eCourts session:', error);
        throw error;
    }
}

async function getCaseStatus(cnr, courtType, token) {
    try {
        const response = await axios.post(`${config.ECOURTS_API.baseUrl}/case-history`, {
            cnr,
            courtType
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data.success) {
            throw new Error('Failed to fetch case status');
        }

        const caseData = response.data.data;
        return {
            cnr,
            status: caseData.case_status || 'Unknown',
            court: caseData.court_name,
            nextHearing: caseData.next_hearing_date || 'Not scheduled',
            lastOrder: caseData.last_order_details || 'No recent orders',
            courtType
        };
    } catch (error) {
        console.error(`Error fetching status for CNR ${cnr}:`, error);
        throw error;
    }
}

async function processCaseBatch(cases, token) {
    const updates = await Promise.all(cases.map(async (caseItem) => {
        try {
            const caseStatus = await getCaseStatus(caseItem.cnr, caseItem.courtType, token);
            
            // Check if status has changed
            if (caseStatus.status !== caseItem.lastStatus) {
                // Send WhatsApp notification
                const message = formatStatusMessage(caseStatus, caseItem.lastStatus);
                await sendWhatsAppNotification(caseItem.whatsappNumber, message);
                
                // Update status in database
                await updateCaseStatus(
                    caseItem.cnr,
                    caseItem.userId,
                    caseStatus.status,
                    new Date().toISOString()
                );
                
                return {
                    cnr: caseItem.cnr,
                    success: true,
                    notified: true
                };
            }
            
            return {
                cnr: caseItem.cnr,
                success: true,
                notified: false
            };
        } catch (error) {
            console.error(`Error processing CNR ${caseItem.cnr}:`, error);
            return {
                cnr: caseItem.cnr,
                success: false,
                error: error.message
            };
        }
    }));
    
    return updates;
}

exports.handler = async (event, context) => {
    console.log('Starting WhatsApp case status update job...');
    try {
        // Get all tracked cases from DynamoDB
        const trackedCases = await getAllTrackedCases();
        if (!trackedCases.length) {
            console.log('No cases to process');
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No cases to process' })
            };
        }

        // Initialize eCourts session
        const token = await initializeEcourtsSession();

        // Split cases into batches
        const batches = splitIntoBatches(trackedCases, config.LAMBDA_CONFIG.batchSize);
        
        // Process each batch
        const results = [];
        for (const batch of batches) {
            const batchResults = await processCaseBatch(batch, token);
            results.push(...batchResults);
        }

        // Compile statistics
        const stats = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            notified: results.filter(r => r.notified).length,
            failed: results.filter(r => !r.success).length
        };

        console.log('Job completed successfully:', stats);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Case status update job completed',
                statistics: stats,
                results
            })
        };

    } catch (error) {
        console.error('Error in WhatsApp case status update job:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error running case status update job',
                error: error.message
            })
        };
    }
};
