// lambda/config.js

module.exports = {
    // Database Configuration
    DB_CONFIG: {
        region: process.env.AWS_REGION,
        tableName: process.env.DYNAMODB_TABLE
    },
    
    // WhatsApp Configuration (using Twilio)
    WHATSAPP_CONFIG: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_WHATSAPP_NUMBER
    },
    
    // eCourts API Configuration
    ECOURTS_API: {
        baseUrl: process.env.ECOURTS_API_URL || 'http://localhost:3000/api'
    },
    
    // Lambda Configuration
    LAMBDA_CONFIG: {
        scheduleRate: 'rate(6 hours)', // Run every 6 hours
        maxConcurrentAPICalls: 10,
        batchSize: 25 // Number of cases to process in each batch
    }
};
