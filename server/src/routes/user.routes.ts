import { Router } from 'express';
import { updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { updateProfileSchema } from '../validations/auth.validation.js';

const router = Router();

router.use(requireAuth);

router.get('/me', (req, res) => {
  res.json({ success: true, data: { user: req.user!.toJSON() } });
});

router.patch('/me', validateRequest(updateProfileSchema), updateProfile);
router.delete('/me', deleteAccount);

export default router;
