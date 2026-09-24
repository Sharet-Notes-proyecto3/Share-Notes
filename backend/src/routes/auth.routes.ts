// src/routes/auth.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', ctrl.register);

// POST /api/auth/login
router.post('/login', ctrl.login);

// GET  /api/auth/profile/related-topic?tema=... (requiere token)
router.get('/profile/related-topic', authMiddleware, ctrl.getRelatedTopic);

// GET  /api/auth/profile  (requiere token)
router.get('/profile', authMiddleware, ctrl.getProfile);

// GET   /api/auth/careers          (requiere token)
router.get('/careers', authMiddleware, ctrl.getCareers);

// PATCH /api/auth/profile/academic (requiere token) — guarda carrera y semestre del onboarding
router.patch('/profile/academic', authMiddleware, ctrl.updateAcademicProfile);

export default router;
