/**
 * Console capture for TestBoardBed integration.
 * Sends console output to parent harness when running inside an iframe.
 */
export function setupConsoleCapture(): void {
    // Only capture when running inside an iframe
    if (window.parent === window) return;

    const levels = ['log', 'info', 'warn', 'error'] as const;

    levels.forEach((level) => {
        const original = console[level];
        console[level] = (...args: unknown[]) => {
            // Call original console method
            original.apply(console, args);

            // Send to harness
            try {
                window.parent.postMessage({
                    type: 'harness-console',
                    level,
                    message: args.map(arg =>
                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                    ).join(' '),
                    timestamp: Date.now(),
                }, '*');
            } catch {
                // Ignore postMessage errors
            }
        };
    });

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
        try {
            window.parent.postMessage({
                type: 'harness-console',
                level: 'error',
                message: `Uncaught error: ${event.message}`,
                stack: event.error?.stack,
                timestamp: Date.now(),
            }, '*');
        } catch {
            // Ignore
        }
    });
}
