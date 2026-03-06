/**
 * ScaleX REST API Client
 * Thin typed wrapper around the ScaleX indexer API.
 */

const API_URL = process.env.API_URL ?? 'https://base-sepolia-api.scalex.money'

export async function fetchAPI<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(path, API_URL)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}: ${url}`)
  return res.json() as Promise<T>
}

export async function postAPI<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(path, API_URL)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}: ${url}`)
  return res.json() as Promise<T>
}
