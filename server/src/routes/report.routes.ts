import { Router } from 'express';
import {
  uploadReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  downloadReport,
  triggerAnalysis,
  updateMeasurement,
  addMeasurement,
  confirmMeasurements,
} from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);

router.post('/', uploadMiddleware.single('file'), uploadReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);
router.get('/:id/download', downloadReport);
router.post('/:id/analyze', triggerAnalysis);
router.post('/:id/measurements', addMeasurement);
router.patch('/:id/measurements/:measurementId', updateMeasurement);
router.post('/:id/confirm-measurements', confirmMeasurements);

export default router;
