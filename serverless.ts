import type { AWS } from '@serverless/typescript';

import processMessages from '@functions/processMessages';
import processQueue from '@functions/processQueue';

const serverlessConfiguration: AWS = {
  service: 'telegram-music-bot',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
  ],
  // auto decrypt ssm secure strings
  variablesResolutionMode: '20210326',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'eu-north-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    eventBridge: {
      useCloudFormation: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      LINK_TABLE_NAME: { 'Ref': 'LinksTable' },
      LINK_TABLE_GSI_NAME: 'LinksNotSentLocalIndex',
      TELEGRAM_CHANNEL_ID: '${ssm:/telegram-music-channel-id}',
      TELEGRAM_BOT_TOKEN: '${ssm:/telegram-music-bot-token}',
      SENTRY_DSN: '${ssm:/telegram-music-bot-sentry-dsn}',
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:PutItem',
          'dynamodb:DescribeTable',
        ],
        Resource: [
          { 'Fn::GetAtt': ['LinksTable', 'Arn'] },
          { 'Fn::Join': ['/', [{ 'Fn::GetAtt': ['LinksTable', 'Arn'] }, 'index', '*']] },
        ],
      },
    ],
  },
  functions: {
    processMessages,
    processQueue,
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    ddbTable: {
      name: 'Links',
      gsiIndexName: 'LinksNotSentLocalIndex',
    },
  },
  resources: {
    Resources: {
      // DynamoDB table
      LinksTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:custom.ddbTable.name}',
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          AttributeDefinitions: [{
            AttributeName: 'link',
            AttributeType: 'S',
          },
          {
            AttributeName: 'createdAt',
            AttributeType: 'N',
          },
          {
            AttributeName: 'notSent',
            AttributeType: 'N',
          }],
          KeySchema: [
            {
              AttributeName: 'link',
              KeyType: 'HASH',
            },
          ],
          GlobalSecondaryIndexes: [{
            IndexName: '${self:custom.ddbTable.gsiIndexName}',
            KeySchema: [
              {
                AttributeName: 'notSent',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              },
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1,
            },
          }],
        },
      },
    }
  },
};

module.exports = serverlessConfiguration;
