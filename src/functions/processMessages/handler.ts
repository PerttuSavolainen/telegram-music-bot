import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { logError } from '@libs/logging';
import {
  allowedCommands,
  helpCommand,
  notValidAction,
  queueCommand,
  validateQueueArgument,
} from '@libs/telegram';

interface IMessage {
  message_id: number
  chat: {
    id: number;
    type: string;
  };
  text: string;
}

const processMessage = async (message: IMessage): Promise<void> => {
  // ignore all other messages than private
  if (message?.chat?.type !== 'private') {
    console.log('Non-private message, ignoring...');
    return;
  }

  const {
    message_id: messageId,
    chat: {
      id: chatId,
    },
    text,
  } = message;

  // ignore everything after "first argument" from the message
  const [command, argument] = text.split(' ');

  switch (command) {
    case allowedCommands.start:
    case allowedCommands.help:
      await helpCommand(chatId, messageId);
      break;
    case allowedCommands.addToQueue:
      const valid = validateQueueArgument(argument);
      if (valid) {
        await queueCommand(chatId, messageId, argument);
      } else {
        await notValidAction(chatId, messageId, 'argument');
      }
      break;
    default:
      await notValidAction(chatId, messageId, 'command');
  }
};

const processMessages: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  try {
    const { body } = event;

    const message = (
      body.edited_message
        ? body.edited_message
        : body.message
    ) as IMessage;

    await processMessage(message);
  } catch (error) {
    logError(error);

    return {
      ...formatJSONResponse({
        message: 'Internal server error',
      }),
      statusCode: 500,
    };
  }
  return formatJSONResponse({
    message: 'success',
  });
}

export const main = middyfy(processMessages);
