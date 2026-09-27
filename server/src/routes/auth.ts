import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  getAuthProviders,
} from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/providers', getAuthProviders);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);
router.get('/google', (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    res.redirect(`${config.clientUrl}/login?error=google_unconfigured`);
    return;
  }
  const redirectUri = encodeURIComponent(`${config.clientUrl}/api/auth/google/callback`);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email`);
});
router.get('/google/callback', (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    res.redirect(`${config.clientUrl}/login?error=google_unconfigured`);
    return;
  }
  res.redirect(`${config.clientUrl}/dashboard`);
});

export default router;
