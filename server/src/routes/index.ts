import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import reportRoutes from './report.routes.js';
import comparisonRoutes from './comparison.routes.js';
import riskRoutes from './risk.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import fs from 'fs';
import { getDbStatus } from '../config/db.js';
import { geminiService } from '../services/ai/geminiService.js';
import { llamaService } from '../services/ai/llamaService.js';
import { ENV } from '../config/env.js';
import { requireDatabase } from '../middleware/requireDatabase.js';

const router = Router();

// Health check endpoint — always reachable even when the database is down
router.get('/health', async (_req, res) => {
  const dbStatus = getDbStatus();
  let storageAccessible = false;
  try {
    fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
    storageAccessible = fs.existsSync(ENV.UPLOAD_DIR);
  } catch {
    storageAccessible = false;
  }

  const healthy = dbStatus.connected;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      aiProvider: {
        provider:
          ENV.AI_PROVIDER === 'local'
            ? 'Fast Local Clinical Engine'
            : (await llamaService.isAvailable())
            ? `Ollama (${llamaService.getModelName()})`
            : geminiService.isConfigured()
            ? 'Google Gemini'
            : 'Fast Local Clinical Engine',
        configured: true,
      },
      storage: {
        provider: ENV.STORAGE_PROVIDER,
        accessible: storageAccessible,
      },
    },
  });
});

router.use(requireDatabase);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/comparisons', comparisonRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', riskRoutes); // includes /reports/:id/risk-assessments and /risk-assessments/:id

export default router;
