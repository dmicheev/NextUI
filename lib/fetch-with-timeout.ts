// Утилита для выполнения fetch с таймаутом и повторными попытками

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 1; // По умолчанию ретраев нет: команды управления не должны повторяться

interface FetchWithTimeoutOptions extends RequestInit {
  /** Таймаут одной попытки, мс */
  timeoutMs?: number;
  /** Общее число попыток (1 = без ретраев) */
  retries?: number;
}

/**
 * fetch с таймаутом и повторными попытками (экспоненциальный backoff: 1s, 2s, 4s...)
 */
export async function fetchWithTimeout(url: string, options: FetchWithTimeoutOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, ...requestInit } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...requestInit, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      const isTimeout = error instanceof Error && error.name === 'AbortError';
      console.warn(
        `[fetchWithTimeout] ${isTimeout ? `Timeout (${timeoutMs}ms)` : 'Request failed'} for ${url}, attempt ${attempt}/${retries}`,
      );

      if (attempt < retries) {
        const backoffDelay = 1000 * 2 ** (attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error(`Request timeout after ${retries} attempt(s) (${timeoutMs}ms each)`);
  }

  throw lastError || new Error('Request failed after retries');
}
