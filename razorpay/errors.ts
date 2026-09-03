export class RazorpayIntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'RazorpayIntegrationError';
  }
}
