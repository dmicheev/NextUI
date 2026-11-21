// Хелпер для прокси-роутов Next.js -> ESP32

import { NextResponse } from 'next/server';

/**
 * Выполняет обращение к ESP32 и маппит результат/ошибку в JSON-ответ роута.
 */
export async function proxyESP32<T>(action: () => Promise<T>, errorContext: string): Promise<NextResponse> {
  try {
    const data = await action();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] ${errorContext}:`, error);
    return NextResponse.json(
      { error: errorContext, details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

/**
 * Короткая запись ответа 400.
 */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
