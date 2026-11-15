import { Router } from 'express';
import {
  evaluateRisk,
  getReportRiskAssessments,
  getRiskAssessmentById,
  createWhatIfScenario,
  getWhatIfScenarios,
} from '../controllers/risk.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/reports/:id/risk-assessments', evaluateRisk);
router.get('/reports/:id/risk-assessments', getReportRiskAssessments);
router.get('/risk-assessments/:id', getRiskAssessmentById);
router.post('/risk-assessments/:id/scenarios', createWhatIfScenario);
router.get('/risk-assessments/:id/scenarios', getWhatIfScenarios);

export default router;
