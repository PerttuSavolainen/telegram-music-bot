#  Telegram Music Bot

Initial boilerplate generated with serverless framework by running `npx serverless create -t aws-nodejs-typescript`.

## Telegram configuration

### Channel

TODO

### Bot

You need a bot and its token. More info [here](https://core.telegram.org/bots#3-how-do-i-create-a-bot).

send a POST request to `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook` with body:

```json
{
	"url": "<YOUR_LAMBDA_ENDPOINT>"
}
```

More info about setWebook [here](https://core.telegram.org/bots/api#setwebhook).

TODO

## AWS Systems Manager - Parameter Store configuration

You need following parameters to be stored in the same region as the application:

- `telegram-music-bot-token`, as secure string
- `telegram-music-channel-id`, as string
- `telegram-music-cron-schedule`, as string e.g. `0 7 ? * MON-FRI *`
- `telegram-music-bot-sentry-dsn`, as secure string (optional)

## Install

- `npm ci`

## Deploy

- `aws-vault exec <PROFILE> -- npm run deploy`

## Testing

In order to test the given function locally, run the following command:

- `aws-vault exec <PROFILE> -- npx serverless invoke local -f <FUNCTION_NAME> --path src/functions/<FUNCTION_NAME>/mock.json`

## Error handling / logging

Sentry is in use for tracking exceptions. Logs are stored in AWS CloudWatch.

## Project structure

- `functions` - containing code base and configuration for your lambda functions
- `libs` - containing shared code base between your lambdas
