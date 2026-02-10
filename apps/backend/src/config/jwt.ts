// Validate JWT_SECRET in production
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ FATAL: JWT_SECRET environment variable must be set in production!');
    }
    console.warn('⚠️  WARNING: Using default JWT secret - OK for development only');
    return 'dev-only-secret-do-not-use-in-production';
  }
  
  return secret;
};

export const JWT_CONFIG = {
  secret: getJwtSecret(),
  accessTokenExpiry: '15m',  // 15 minutes
  refreshTokenExpiry: '7d',  // 7 days
};


