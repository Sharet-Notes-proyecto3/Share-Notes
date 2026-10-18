// src/routes/auth.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadProfilePhoto } from '../middlewares/upload.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', ctrl.register);

// POST /api/auth/login
router.post('/login', ctrl.login);

// GET  /api/auth/profile/related-topic?tema=... (requiere token)
router.get('/profile/related-topic', authMiddleware, ctrl.getRelatedTopic);

// GET  /api/auth/profile  (requiere token)
router.get('/profile', authMiddleware, ctrl.getProfile);
router.patch('/profile', authMiddleware, ctrl.updateProfile);
router.post('/profile/photo', authMiddleware, uploadProfilePhoto, ctrl.uploadProfilePhoto);
router.delete('/profile/photo', authMiddleware, ctrl.deleteProfilePhoto);

export default router;
