// lambda/schema.js

const CaseStatusSchema = {
    TableName: process.env.DYNAMODB_TABLE,
    AttributeDefinitions: [
        {
            AttributeName: 'cnr',
            AttributeType: 'S'
        },
        {
            AttributeName: 'userId',
            AttributeType: 'S'
        }
    ],
    KeySchema: [
        {
            AttributeName: 'cnr',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'userId',
            KeyType: 'RANGE'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    GlobalSecondaryIndexes: [
        {
            IndexName: 'UserIdIndex',
            KeySchema: [
                {
                    AttributeName: 'userId',
                    KeyType: 'HASH'
                }
            ],
            Projection: {
                ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ]
};

module.exports = {
    CaseStatusSchema
};
