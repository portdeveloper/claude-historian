/**
 * Format a date as relative time (e.g., "2 days ago", "just now")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'just now';
  }
  if (diffMins < 60) {
    return diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  }
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

/**
 * Pad a string to a fixed width (for column alignment)
 */
export function padRight(str: string, width: number): string {
  if (str.length >= width) {
    return str.slice(0, width - 1) + '…';
  }
  return str + ' '.repeat(width - str.length);
}
