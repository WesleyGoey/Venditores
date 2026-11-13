/** Laravel's CSRF token from the XSRF-TOKEN cookie, for fetch requests. */
export function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}
