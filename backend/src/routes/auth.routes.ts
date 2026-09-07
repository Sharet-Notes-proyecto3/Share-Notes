// src/routes/auth.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', ctrl.register);

// POST /api/auth/login
router.post('/login', ctrl.login);

// GET  /api/auth/profile/related-topic?tema=...
router.get('/profile/related-topic', ctrl.getRelatedTopic);

// GET  /api/auth/profile  (requiere token)
router.get('/profile', authMiddleware, ctrl.getProfile);

export default router;
