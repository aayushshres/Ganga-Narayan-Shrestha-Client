/**
 * Extract an 11-character YouTube video ID from any of these formats:
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   https://youtu.be/dQw4w9WgXcQ
 *   https://www.youtube.com/embed/dQw4w9WgXcQ
 *   dQw4w9WgXcQ  (already an ID)
 */
export function extractYouTubeId(input: string): string {
  const s = input.trim();

  // Already a bare ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  // ?v= or &v= (watch URLs)
  const vParam = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParam) return vParam[1];

  // youtu.be/<id>
  const shortUrl = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortUrl) return shortUrl[1];

  // /embed/<id>
  const embedUrl = s.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedUrl) return embedUrl[1];

  // Return as-is; YouTubeModal will show YouTube's own error
  return s;
}
