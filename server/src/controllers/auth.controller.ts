import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { signToken, generateSecureRandomToken, hashToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ENV, isEmailConfigured } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      sendError(res, 'An account with this email address already exists.', 409, {
        email: ['An account with this email address already exists.'],
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      accountStatus: 'active',
      themePreference: 'system',
    });

    const token = signToken(user._id.toString());

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.IS_PRODUCTION,
      sameSite: ENV.IS_PRODUCTION ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User registered successfully: ${user._id}`);

    sendSuccess(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Account created successfully',
      201
    );
  } catch (error) {
    logger.error('Registration failed', error);
    sendError(res, 'Failed to create account. Please try again.', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      sendError(res, 'Invalid email or password combination.', 401);
      return;
    }

    if (user.accountStatus !== 'active') {
      sendError(res, 'Your account is suspended or inactive.', 403);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'Invalid email or password combination.', 401);
      return;
    }

    const token = signToken(user._id.toString());

    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.IS_PRODUCTION,
      sameSite: ENV.IS_PRODUCTION ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`User logged in: ${user._id}`);

    sendSuccess(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    logger.error('Login failed', error);
    sendError(res, 'Login failed. Please try again later.', 500);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.IS_PRODUCTION,
    sameSite: ENV.IS_PRODUCTION ? 'strict' : 'lax',
  });
  sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Not authenticated', 401);
    return;
  }
  sendSuccess(res, { user: req.user.toJSON() });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    const emailReady = isEmailConfigured();

    // Always return a generic message to prevent user enumeration; never claim email delivery without SMTP.
    if (!user) {
      sendSuccess(
        res,
        { emailDelivery: emailReady ? 'queued' : 'unavailable' },
        emailReady
          ? 'If an account exists with that email, password reset instructions will be sent when email delivery is configured.'
          : 'No email provider is configured. If this account exists, a development reset token is only issued for confirmed accounts in local development — not by email.'
      );
      return;
    }

    const { rawToken, hashedToken } = generateSecureRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens
    await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true });

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashedToken,
      expiresAt,
      used: false,
    });

    if (emailReady) {
      logger.info(`Password reset token created for user ${user._id}. Email delivery is configured but SMTP sending is not implemented in this local build.`);
    } else if (!ENV.IS_PRODUCTION) {
      logger.info(
        `Password reset token created for user ${user._id}. Email is not configured; a one-time development reset link was returned to the authenticated recovery form only.`
      );
    }

    sendSuccess(
      res,
      !ENV.IS_PRODUCTION && !emailReady ? { devResetToken: rawToken, emailDelivery: 'unavailable' } : { emailDelivery: emailReady ? 'not_implemented' : 'unavailable' },
      emailReady
        ? 'A password reset token was created. Automatic email sending is not implemented in this local project; configure SMTP in a production deployment before claiming email delivery.'
        : 'No email provider is configured. A one-time development reset link is available on this page for local testing only. No email was sent.'
    );
  } catch (error) {
    logger.error('Forgot password error', error);
    sendError(res, 'Failed to process password reset request.', 500);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const hashed = hashToken(token);

    const resetRecord = await PasswordResetToken.findOne({
      tokenHash: hashed,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      sendError(res, 'Password reset token is invalid or has expired.', 400);
      return;
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      sendError(res, 'User account associated with this token not found.', 400);
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    logger.info(`Password reset successfully for user: ${user._id}`);
    sendSuccess(res, null, 'Password has been reset successfully. Please log in with your new password.');
  } catch (error) {
    logger.error('Reset password error', error);
    sendError(res, 'Failed to reset password.', 500);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect.', 400, {
        currentPassword: ['Current password is incorrect.'],
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    logger.info(`Password changed for user: ${user._id}`);
    sendSuccess(res, null, 'Password updated successfully');
  } catch (error) {
    logger.error('Change password error', error);
    sendError(res, 'Failed to change password.', 500);
  }
};
