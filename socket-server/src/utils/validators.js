/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid, errors }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (password && password.length > 50) {
    errors.push('Password must be less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} { isValid, errors }
 */
export const validateName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (name && name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate workspace name
 * @param {string} name - Workspace name
 * @returns {Object} { isValid, errors }
 */
export const validateWorkspaceName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Workspace name is required');
  }
  if (name && name.length > 50) {
    errors.push('Workspace name must be less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate channel name
 * @param {string} name - Channel name
 * @returns {Object} { isValid, errors }
 */
export const validateChannelName = (name) => {
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Channel name is required');
  }
  if (name && name.length > 30) {
    errors.push('Channel name must be less than 30 characters');
  }
  if (name && !/^[a-z0-9-_]+$/i.test(name)) {
    errors.push('Channel name can only contain letters, numbers, hyphens, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate message content
 * @param {string} content - Message content
 * @returns {Object} { isValid, errors }
 */
export const validateMessage = (content) => {
  const errors = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  if (content && content.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file
 * @param {File} file - File to validate
 * @param {Array} allowedTypes - Allowed MIME types
 * @param {number} maxSize - Max file size in bytes
 * @returns {Object} { isValid, error }
 */
export const validateFile = (file, allowedTypes, maxSize) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate workspace ID format
 * @param {string} id - Workspace ID
 * @returns {boolean}
 */
export const isValidWorkspaceId = (id) => {
  return id && /^[a-f0-9]{24}$/i.test(id);
};

/**
 * Validate meeting ID format
 * @param {string} id - Meeting ID
 * @returns {boolean}
 */
export const isValidMeetingId = (id) => {
  return id && /^[a-z0-9]{6,10}$/i.test(id);
};

/**
 * Sanitize input (basic XSS prevention)
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Check if a string is empty or only whitespace
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isEmptyString = (str) => {
  return !str || str.trim().length === 0;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default {
  isValidEmail,
  validatePassword,
  validateName,
  validateWorkspaceName,
  validateChannelName,
  validateMessage,
  validateFile,
  isValidWorkspaceId,
  isValidMeetingId,
  sanitizeInput,
  isEmptyString,
  isValidUrl
};