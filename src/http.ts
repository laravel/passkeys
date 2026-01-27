interface CsrfToken {
    header: string;
    value: string;
}

/**
 * Get the CSRF token.
 */
function getCsrfToken(): CsrfToken | null {
    if (typeof document === "undefined") return null;

    // First, try the meta tag (traditional Blade setup)
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        const value = meta.getAttribute("content");
        if (value) {
            return { header: "X-CSRF-TOKEN", value };
        }
    }

    // Fall back to XSRF-TOKEN cookie (Sanctum SPA setup)
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));

    if (cookie) {
        const value = cookie.split("=")[1];
        if (value) {
            return { header: "X-XSRF-TOKEN", value: decodeURIComponent(value) };
        }
    }

    return null;
}

/**
 * Make a GET request to the Laravel backend.
 */
export async function get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
        credentials: "same-origin",
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
}

/**
 * Make a POST request to the Laravel backend.
 */
export async function post<T>(url: string, data: unknown): Promise<T> {
    const csrf = getCsrfToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (csrf) {
        headers[csrf.header] = csrf.value;
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
}

/**
 * Handle error responses from the server.
 */
async function handleErrorResponse(response: Response): Promise<never> {
    let message = `Request failed with status ${response.status}`;

    try {
        const data: unknown = await response.json();
        if (
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof data.message === "string"
        ) {
            message = data.message;
        }
    } catch {
        // Response wasn't JSON, use default message
    }

    throw new Error(message);
}
