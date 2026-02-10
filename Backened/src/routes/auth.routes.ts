import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Auth Routes
 * /api/v1/auth
 */

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/resend-password-otp', authController.resendPasswordResetOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout); // Logout
router.get('/me', authenticate, authController.getMe); // Get current user
router.patch('/me', authenticate, authController.updateProfile); // Update current user profile (name)
router.post('/change-password', authenticate, authController.changePassword); // Change password (current + new)
router.post('/refresh', authenticate, authController.refreshToken); // Refresh token

export default router;

