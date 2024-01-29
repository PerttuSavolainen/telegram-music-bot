import { middyfy } from '@libs/lambda';
import { logError } from '@libs/logging';
import { countToFetch } from '@libs/misc';
import * as telegram from '@libs/telegram';
import * as ddb from '@libs/dynamodb';

const telegramChannelId = Number(process.env.TELEGRAM_CHANNEL_ID);

const processQueue: any = async () => {
  try {
    const nonArchivedCount = await ddb.getNonArchivedLinksCount();
    const count = countToFetch(nonArchivedCount);
    const links = await ddb.getLinks(count);

    console.log('Amount of links: ', links.length);

    // wait all messages to be sent
    await Promise.all(
      links
        .map(async (musicLink: ddb.MusicLink) => {
          await telegram.sendMessage(telegramChannelId, musicLink.link);
          await ddb.archiveLink(musicLink);
        }),
    );
  } catch (error) {
    logError(error);

    return {
      statusCode: 500,
    };
  }

  return {
    statusCode: 200,
  };
}

export const main = middyfy(processQueue, false);
