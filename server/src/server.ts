import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ENV, assertProductionSecrets, setMongoUri } from './config/env.js';
import { isLocalMongoUri, startPersistentLocalMongo, stopPersistentLocalMongo } from './config/localMongo.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    assertProductionSecrets();

    let connected = await connectDatabase();

    if (!connected && !ENV.IS_PRODUCTION && isLocalMongoUri(ENV.MONGODB_URI)) {
      try {
        const embeddedUri = await startPersistentLocalMongo();
        setMongoUri(embeddedUri);
        connected = await connectDatabase();
      } catch (embeddedError) {
        logger.error(
          'Failed to start embedded MongoDB. Install MongoDB Community Server, or create a free Atlas cluster and set MONGODB_URI.',
          embeddedError
        );
      }
    }

    const server = app.listen(ENV.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`MedExplain_AI Server running on port ${ENV.PORT}`);
      logger.info(`Environment: ${ENV.NODE_ENV}`);
      logger.info(`Client URL: ${ENV.CLIENT_URL}`);
      logger.info(`Storage Provider: ${ENV.STORAGE_PROVIDER}`);
      logger.info(`API Base URL: http://localhost:${ENV.PORT}/api/v1`);
      logger.info(`Health Endpoint: http://localhost:${ENV.PORT}/api/v1/health`);
      if (!connected) {
        logger.error(
          'DATABASE NOT CONNECTED. The HTTP server is up so the health endpoint can report the failure, but authentication and medical-record APIs will return HTTP 503 until MongoDB is available.'
        );
      }
      logger.info(`====================================================`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        await stopPersistentLocalMongo();
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT');
    });
  } catch (error) {
    logger.error('Fatal error during server startup', error);
    process.exit(1);
  }
};

void startServer();
