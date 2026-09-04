// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Messages
export const MESSAGES = {
  // Auth
  AUTH: {
    REGISTERED: 'Registration successful. Please verify your email.',
    LOGIN_SUCCESS: 'Login successful.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    TOKEN_REFRESHED: 'Token refreshed successfully.',
    PASSWORD_RESET_SENT: 'Password reset email sent.',
    PASSWORD_RESET_SUCCESS: 'Password reset successful.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    MOBILE_VERIFIED: 'Mobile number verified successfully.',
    OTP_SENT: 'OTP sent successfully.',
    OTP_VERIFIED: 'OTP verified successfully.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_SUSPENDED: 'Your account has been suspended.',
    ACCOUNT_DELETED: 'Your account has been deleted.',
    UNAUTHORIZED: 'Authentication required.',
    TOKEN_EXPIRED: 'Session expired. Please login again.',
    TOKEN_INVALID: 'Invalid token.',
    EMAIL_EXISTS: 'Email already registered.',
    MOBILE_EXISTS: 'Mobile number already registered.',
  },

  // User
  USER: {
    PROFILE_UPDATED: 'Profile updated successfully.',
    PROFILE_FETCHED: 'Profile fetched successfully.',
    DELETED: 'Account deleted successfully.',
    NOT_FOUND: 'User not found.',
    IMAGE_UPLOADED: 'Profile image uploaded successfully.',
  },

  // Emergency
  EMERGENCY: {
    CREATED: 'Emergency created successfully.',
    UPDATED: 'Emergency updated successfully.',
    CANCELLED: 'Emergency cancelled.',
    NOT_FOUND: 'Emergency not found.',
  },

  // Blood
  BLOOD: {
    REQUEST_CREATED: 'Blood request created.',
    DONATION_RECORDED: 'Blood donation recorded.',
    NOT_FOUND: 'Blood request not found.',
  },

  // Campaign
  CAMPAIGN: {
    CREATED: 'Campaign created successfully.',
    UPDATED: 'Campaign updated.',
    VERIFIED: 'Campaign verified.',
    REJECTED: 'Campaign rejected.',
    NOT_FOUND: 'Campaign not found.',
  },

  // General
  GENERAL: {
    SUCCESS: 'Operation successful.',
    NOT_FOUND: 'Resource not found.',
    BAD_REQUEST: 'Invalid request data.',
    INTERNAL_ERROR: 'Internal server error.',
    VALIDATION_ERROR: 'Validation failed.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// OTP Settings
export const OTP = {
  LENGTH: 6,
  EXPIRES_IN_MINUTES: 10,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// Token
export const TOKEN = {
  BEARER_PREFIX: 'Bearer ',
  HEADER_NAME: 'authorization',
} as const;
