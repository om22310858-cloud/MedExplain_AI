import { Router } from 'express';
import {
  createComparison,
  getComparisons,
  getComparisonById,
  deleteComparison,
} from '../controllers/comparison.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.post('/', createComparison);
router.get('/', getComparisons);
router.get('/:id', getComparisonById);
router.delete('/:id', deleteComparison);

export default router;
