const WIKIPEDIA_API_URL = 'https://es.wikipedia.org/w/api.php';

export async function getRelatedArticle(topic: string): Promise<string | null> {
  if (!topic?.trim()) return null;
  try {
    const params = new URLSearchParams({
      action: 'opensearch',
      search: topic,
      limit: '1',
      namespace: '0',
      format: 'json',
      origin: '*',
    });
    const res = await fetch(`${WIKIPEDIA_API_URL}?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as [string, string[], string[], string[]];
    return data[3]?.[0] || null;
  } catch (err) {
    console.error('[Wikipedia-API] Error:', err);
    return null;
  }
}