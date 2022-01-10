import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

const linkTableName = process.env.LINK_TABLE_NAME;
const index = process.env.LINK_TABLE_GSI_NAME;

export class MusicLink extends Document {
  link: string;
  notSent?: number;
  createdAt?: number;
  updatedAt?: number;
}

const schema = new dynamoose.Schema({
  link: {
    type: String,
    hashKey: true,
  },
  // use number type as a boolean for GSI (Boolean type not supported).
  // remove the attribute when processed to work as a sparse index
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes-general-sparse-indexes.html
  notSent: {
    type: Number,
    index: {
      name: index,
      global: true,
      rangeKey: 'createdAt',
    },
  },
  createdAt: {
    type: Number,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: {
    createdAt: null,
    updatedAt: 'updatedAt',
  },
});

const MusicLinkModel = dynamoose.model<MusicLink>(linkTableName, schema, {
  // disable create, table is defined in serverless.ts
  create: false,
});

export const getLink = async (link: string): Promise<MusicLink> => {
  return MusicLinkModel.get(link);
};

export const updateLink = async (updateObject): Promise<void> => {
  await MusicLinkModel.update(updateObject);
};

export const createLink = async (link: string): Promise<void> => {
  const musicLink = new MusicLinkModel({
    link,
    notSent: 1,
  });
  await musicLink.save();
};

export const getNonArchivedLinksCount = async (): Promise<number> => {
  const { count } = await MusicLinkModel
    .query('notSent')
    .eq(1)
    .using(index)
    .count()
    .exec();
  return count;
};

export const getLinks = async (amount: number): Promise<MusicLink[]> => {
  const links: MusicLink[] = await MusicLinkModel
    .query('notSent')
    .eq(1)
    .using(index)
    .exec();
  return links.slice(0, amount);
};

export const archiveLink = async (musicLink: MusicLink) => {
  await MusicLinkModel.update(
    musicLink,
    {
      '$REMOVE': {
        'notSent': null,
      }
    } as any);
};
