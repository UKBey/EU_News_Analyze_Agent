import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip HTML tags from a string and clean up whitespace
 * Safe for use in browser environment
 */
export function stripHtmlTags(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: simple regex-based stripping
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  // Client-side: use DOM parser for better accuracy
  const tmp = document.createElement("DIV")
  tmp.innerHTML = html
  const text = tmp.textContent || tmp.innerText || ""
  
  // Clean up extra whitespace
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}
