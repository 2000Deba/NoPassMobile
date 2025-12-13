import { API_BASE_URL } from "@/constants/config";

export async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = await res.json();
    return data;
}
