/**
 * WebSocket utility for connecting to the backend
 * Automatically uses ws:// or wss:// based on the page protocol
 */

/**
 * Creates a WebSocket connection to the specified path
 * @param path - The WebSocket path (e.g., '/ws')
 * @returns WebSocket instance
 */
export function createWebSocket(path: string): WebSocket {
    // Determine protocol based on page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    const wsUrl = `${protocol}//${host}${cleanPath}`;

    console.log('Creating WebSocket connection to:', wsUrl);

    return new WebSocket(wsUrl);
}

/**
 * Creates a WebSocket with automatic reconnection
 * @param path - The WebSocket path
 * @param onMessage - Message handler
 * @param onError - Error handler (optional)
 * @param reconnectDelay - Delay before reconnecting in ms (default: 3000)
 */
export function createReconnectingWebSocket(
    path: string,
    onMessage: (event: MessageEvent) => void,
    onError?: (event: Event) => void,
    reconnectDelay: number = 3000
): { ws: WebSocket | null; close: () => void } {
    let ws: WebSocket | null = null;
    let shouldReconnect = true;
    let reconnectTimeout: number | null = null;

    const connect = () => {
        ws = createWebSocket(path);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = onMessage;

        ws.onerror = (event) => {
            console.error('WebSocket error:', event);
            if (onError) onError(event);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            if (shouldReconnect) {
                console.log(`Reconnecting in ${reconnectDelay}ms...`);
                reconnectTimeout = window.setTimeout(connect, reconnectDelay);
            }
        };
    };

    connect();

    return {
        ws,
        close: () => {
            shouldReconnect = false;
            if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        },
    };
}
