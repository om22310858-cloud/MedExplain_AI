import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from '../utils/logger.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, '../..');

let embeddedMongo: MongoMemoryServer | null = null;

export const isLocalMongoUri = (uri: string): boolean => {
  return /mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(uri);
};

export const startPersistentLocalMongo = async (): Promise<string> => {
  if (embeddedMongo) {
    return embeddedMongo.getUri('medexplain_ai');
  }

  const dataDir = path.join(serverRoot, '.data', 'mongo');
  fs.mkdirSync(dataDir, { recursive: true });

  logger.warn(
    'No MongoDB process is listening on the configured local URI. Starting a persistent embedded MongoDB for local development.'
  );

  embeddedMongo = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'medexplain_ai',
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
    },
  });

  const uri = embeddedMongo.getUri('medexplain_ai');
  logger.info(`Embedded MongoDB ready. Data directory: ${dataDir}`);
  return uri;
};

export const stopPersistentLocalMongo = async (): Promise<void> => {
  if (embeddedMongo) {
    await embeddedMongo.stop();
    embeddedMongo = null;
  }
};
