import type { Request, Response } from 'express';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { User, IUser } from '../../models';
import { Workspace } from '../../models';
import { JWT_CONFIG } from '../../config/jwt';

interface TokenPayload {
  userId: string;
  email: string;
}

function generateAccessToken(user: IUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };
  // Cast expiresIn to satisfy jsonwebtoken's overloaded typings
  return jwt.sign(
    payload,
    JWT_CONFIG.secret as Secret,
    { expiresIn: JWT_CONFIG.accessTokenExpiry as unknown as SignOptions['expiresIn'] }
  );
}

function generateRefreshToken(user: IUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };
  return jwt.sign(
    payload,
    JWT_CONFIG.secret as Secret,
    { expiresIn: JWT_CONFIG.refreshTokenExpiry as unknown as SignOptions['expiresIn'] }
  );
}

export class AuthAPIController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        passwordHash: password, // Will be hashed by pre-save hook
        name,
      });
      
      // Save user first to get _id
      await user.save();
      
      // Create default workspace for the user
      const workspace = new Workspace({
        name: 'Personal Notes',
        ownerId: user._id,
        memberIds: [user._id],
      });
      await workspace.save();

      // Update user's default workspace
      user.preferences.defaultWorkspace = workspace._id;
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Error details:', { errorMessage, errorStack });
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login user and return tokens
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (client should discard tokens)
   */
  public async logout(req: Request, res: Response): Promise<void> {
    // In a stateless JWT setup, logout is handled client-side
    // For enhanced security, you could implement a token blacklist
    res.json({ message: 'Logout successful' });
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret) as TokenPayload;
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      res.json({
        accessToken,
        user: user.toJSON(),
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Refresh token expired' });
        return;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  public async me(req: Request, res: Response): Promise<void> {
    try {
      // User is attached by auth middleware
      const userId = (req as any).userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
