// lambda/utils.js

const AWS = require('aws-sdk');
const twilio = require('twilio');
const config = require('./config');

// Initialize AWS Services
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: config.DB_CONFIG.region });

// Initialize Twilio Client
const twilioClient = twilio(config.WHATSAPP_CONFIG.accountSid, config.WHATSAPP_CONFIG.authToken);

// DynamoDB Operations
async function getAllTrackedCases() {
    const params = {
        TableName: config.DB_CONFIG.tableName,
        ProjectionExpression: 'cnr, userId, whatsappNumber, lastStatus, courtType, lastUpdated'
    };

    try {
        const result = await dynamodb.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.error('Error fetching tracked cases:', error);
        throw error;
    }
}

async function updateCaseStatus(cnr, userId, newStatus, lastUpdated) {
    const params = {
        TableName: config.DB_CONFIG.tableName,
        Key: { cnr, userId },
        UpdateExpression: 'set lastStatus = :status, lastUpdated = :updated',
        ExpressionAttributeValues: {
            ':status': newStatus,
            ':updated': lastUpdated
        },
        ReturnValues: 'ALL_NEW'
    };

    try {
        await dynamodb.update(params).promise();
    } catch (error) {
        console.error(`Error updating case status for CNR ${cnr}:`, error);
        throw error;
    }
}

// WhatsApp Notification
async function sendWhatsAppNotification(to, message) {
    try {
        await twilioClient.messages.create({
            body: message,
            from: `whatsapp:${config.WHATSAPP_CONFIG.fromNumber}`,
            to: `whatsapp:${to}`
        });
        console.log(`WhatsApp notification sent to ${to}`);
    } catch (error) {
        console.error(`Error sending WhatsApp notification to ${to}:`, error);
        throw error;
    }
}

// Format status update message
function formatStatusMessage(caseDetails, oldStatus) {
    const changes = [];
    if (caseDetails.status !== oldStatus) {
        changes.push(`Status changed from "${oldStatus}" to "${caseDetails.status}"`);
    }
    if (caseDetails.nextHearing) {
        changes.push(`Next hearing scheduled for ${caseDetails.nextHearing}`);
    }
    if (caseDetails.lastOrder) {
        changes.push(`Latest order: ${caseDetails.lastOrder}`);
    }

    return `
📋 Case Update Alert
CNR: ${caseDetails.cnr}
Court: ${caseDetails.court}
${changes.join('\n')}

View complete details at: https://ecourts.gov.in/ecourts_home/case/${caseDetails.cnr}
`;
}

// Process cases in batches
function splitIntoBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}

module.exports = {
    getAllTrackedCases,
    updateCaseStatus,
    sendWhatsAppNotification,
    formatStatusMessage,
    splitIntoBatches
};
