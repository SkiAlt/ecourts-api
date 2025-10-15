# WhatsApp Case Status Updates - AWS Lambda Function

This Lambda function periodically checks case statuses and sends WhatsApp notifications for any updates.

## Setup Instructions

1. First, install the dependencies:
```bash
cd lambda
npm install
```

2. Create the following environment variables in AWS Lambda:
```
AWS_REGION=your-aws-region
DYNAMODB_TABLE=your-dynamodb-table
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=your-twilio-whatsapp-number
ECOURTS_API_URL=your-ecourts-api-url
```

3. Create the DynamoDB table using the schema in `schema.js`

4. Configure the Lambda function:
   - Runtime: Node.js 18.x
   - Memory: 256 MB
   - Timeout: 5 minutes
   - Schedule: Every 6 hours (using EventBridge)

5. Set up IAM roles with permissions for:
   - DynamoDB access
   - CloudWatch Logs
   - EventBridge (for scheduling)

## Table Structure

The DynamoDB table stores the following information:
- CNR (Case Number Record)
- User ID
- WhatsApp Number
- Last Status
- Court Type
- Last Updated Timestamp

## Features

- Periodic case status checks (every 6 hours)
- Batch processing of cases
- WhatsApp notifications for status changes
- Error handling and retries
- CloudWatch logging
- Status update tracking

## Monitoring

Monitor the function using CloudWatch:
- Logs: Check execution logs and errors
- Metrics: Track invocation count, duration, and errors
- Alarms: Set up alerts for failures or high error rates

## Development

To make changes:
1. Edit the code locally
2. Test using AWS SAM or localstack
3. Deploy using AWS CLI or AWS Console
4. Monitor logs for any issues
