import { format, formatDistance, formatRelative, isToday, isYesterday, differenceInDays } from 'date-fns';

/**
 * Format message time (e.g., "2:30 PM")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatMessageTime = (date) => {
  const d = new Date(date);
  return format(d, 'h:mm a');
};

/**
 * Format message date (e.g., "Today", "Yesterday", or "MMM d")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatMessageDate = (date) => {
  const d = new Date(date);
  
  if (isToday(d)) {
    return 'Today';
  } else if (isYesterday(d)) {
    return 'Yesterday';
  } else {
    return format(d, 'MMM d');
  }
};

/**
 * Full message timestamp (e.g., "Today at 2:30 PM" or "Jan 1 at 2:30 PM")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatMessageTimestamp = (date) => {
  const d = new Date(date);
  const dateStr = formatMessageDate(d);
  const timeStr = formatMessageTime(d);
  return `${dateStr} at ${timeStr}`;
};

/**
 * Format date relative to now (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  const d = new Date(date);
  return formatDistance(d, new Date(), { addSuffix: true });
};

/**
 * Format chat list item time
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatChatListTime = (date) => {
  const d = new Date(date);
  const daysDiff = differenceInDays(new Date(), d);
  
  if (daysDiff === 0) {
    return format(d, 'h:mm a');
  } else if (daysDiff === 1) {
    return 'Yesterday';
  } else if (daysDiff < 7) {
    return format(d, 'EEEE');
  } else {
    return format(d, 'MMM d');
  }
};

/**
 * Format full date
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatFullDate = (date) => {
  const d = new Date(date);
  return format(d, 'MMMM d, yyyy');
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDateTimeLong = (date) => {
  const d = new Date(date);
  return format(d, 'MMMM d, yyyy h:mm a');
};

/**
 * Get just the time from a date
 * @param {Date|string} date - Date to extract time from
 * @returns {string}
 */
export const getTimeFromDate = (date) => {
  const d = new Date(date);
  return format(d, 'h:mm a');
};

/**
 * Get just the date part
 * @param {Date|string} date - Date to extract date from
 * @returns {string}
 */
export const getDatePart = (date) => {
  const d = new Date(date);
  return format(d, 'yyyy-MM-dd');
};

/**
 * Check if two dates are on the same day
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

/**
 * Group messages by date
 * @param {Array} messages - Array of message objects
 * @returns {Object} Messages grouped by date
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = getDatePart(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
};

/**
 * Get date header for message group
 * @param {string} dateStr - Date string (yyyy-MM-dd)
 * @returns {string}
 */
export const getDateHeader = (dateStr) => {
  const date = new Date(dateStr);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (differenceInDays(new Date(), date) < 7) {
    return format(date, 'EEEE');
  } else {
    return format(date, 'MMMM d, yyyy');
  }
};

export default {
  formatMessageTime,
  formatMessageDate,
  formatMessageTimestamp,
  formatRelativeTime,
  formatChatListTime,
  formatFullDate,
  formatDateTimeLong,
  getTimeFromDate,
  getDatePart,
  isSameDay,
  groupMessagesByDate,
  getDateHeader
};