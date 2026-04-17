type CsrfToken = {
    header: string;
    value: string;
};

/**
 * Get the CSRF token.
 */
const getCsrfToken = (): CsrfToken | null => {
    if (typeof document === "undefined") {
        return null;
    }

    // First, try the meta tag (traditional Blade setup)
    // Then fall back to the XSRF-TOKEN cookie (Sanctum SPA setup)
    return getCsrfTokenFromMetaTag() || getCsrfTokenFromCookie();
};

/**
 * Get the CSRF token from the meta tag.
 */
const getCsrfTokenFromMetaTag = (): CsrfToken | null => {
    const meta = document.querySelector('meta[name="csrf-token"]');

    if (!meta) {
        return null;
    }

    const value = meta.getAttribute("content");

    return value ? { header: "X-CSRF-TOKEN", value } : null;
};

/**
 * Get the CSRF token from the XSRF-TOKEN cookie.
 */
const getCsrfTokenFromCookie = (): CsrfToken | null => {
    const cookieIdentifier = "XSRF-TOKEN=";
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(cookieIdentifier));

    if (!cookie) {
        return null;
    }

    const value = cookie.slice(cookieIdentifier.length);

    return value
        ? { header: "X-XSRF-TOKEN", value: decodeURIComponent(value) }
        : null;
};

/**
 * Make a GET request to the Laravel backend.
 */
export const get = async <T>(url: string): Promise<T> => {
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
};

/**
 * Make a POST request to the Laravel backend.
 */
export const post = async <T>(url: string, data: unknown): Promise<T> => {
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
};

/**
 * Handle error responses from the server.
 */
const handleErrorResponse = async (response: Response): Promise<never> => {
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
};
