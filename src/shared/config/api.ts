const API_ORIGIN_KEY = 0x2A
const API_ORIGIN_PAYLOAD = 'Ql5eWlkQBQUbGRgEGB4ZBBsbHQQYHg=='

function decodeApiOrigin(payload: string): string {
    const raw = atob(payload)
    let origin = ''

    for (let index = 0; index < raw.length; index++)
        origin += String.fromCharCode(raw.charCodeAt(index) ^ API_ORIGIN_KEY)

    return origin
}

const API_ORIGIN = decodeApiOrigin(API_ORIGIN_PAYLOAD)
const API_ROOT = `${API_ORIGIN}/api`

const envApiUrl = import.meta.env.VITE_APP_API_URL?.replace(/\/+$/, '')

/** Корень API: станции, прокси потоков и т.п. (`.../api`). */
export const API_BASE_URL = envApiUrl || API_ROOT

/** Корень YouTube Music API (`.../api/yt`). */
export const API_YT_BASE_URL = `${API_BASE_URL}/yt`
