import fetch from 'node-fetch';
// import * as sqs from '@libs/sqs';
import * as ddb from '@libs/dynamodb';

const TELEGRAM_API_ORIGIN = 'https://api.telegram.org/bot';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const helpMessage = () => `
Meep Morp, I'm a Music Bot. Available commands:

${allowedCommands.help} - Show this message.
${allowedCommands.addToQueue} - Add youtube or spotify link as an argument to a queue.
Example: ${allowedCommands.addToQueue} https://youtu.be/dQw4w9WgXc

Queued music links will be periodically shared in the Music Channel. Zeep.
`;

export const allowedCommands: Readonly<{ [key: string]: string }> = {
  start: '/start',
  help: '/help',
  addToQueue: '/q',
};

export const validateQueueArgument = (arg?: string): boolean => {
  const allowList: ReadonlyArray<RegExp> = [
    // spotify links
    new RegExp(/^(http(s)?:\/\/)?open.spotify.com\/track\/.+/gm),
    // youtube links
    // thank you kind stranger: https://www.regextester.com/94360
    new RegExp(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm),
  ];
  return allowList.some(regexp => (arg || '').match(regexp))
}

export const helpCommand = async (chatId: number, messageId: number) => {
  await sendMessage(chatId, helpMessage(), messageId);
};

export const queueCommand = async (chatId: number, messageId: number, argument: string) => {
  if (await ddb.getLink(argument)) {
    await sendMessage(chatId, 'Link has already been shared in the music channel, not adding it to queue again.', messageId);
    return;
  }
  await ddb.createLink(argument);
  await sendMessage(chatId, 'Link added to the queue', messageId);
};

export const notValidAction = async (chatId: number, messageId: number, type: 'argument' | 'command') => {
  await sendMessage(
    chatId,
    `Not a valid ${type}. Check ${allowedCommands.help} if you're not sure what to do.`,
    messageId,
  );
};

export const sendMessage = async (
  chatId: number | string,
  message: string,
  messageId?: number,
  parseMode?: 'MarkdownV2' | 'HTML',
) => {
  const endpoint = TELEGRAM_API_ORIGIN + TELEGRAM_BOT_TOKEN + '/sendMessage';
  const response = await fetch(endpoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      // optionally add reply parameter
      ...(messageId && { reply_to_message_id: messageId }),
      // optionally add parse mode
      ...(parseMode && { parse_mode: parseMode }),
    }),
  });

  if (!response.ok) {
    const { status, statusText } = response;
    throw Error(
      `Telegram API error: status "${status}" with text "${statusText}"`,
    );
  }
};