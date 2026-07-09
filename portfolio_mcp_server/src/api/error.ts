export class PortfolioApiError extends Error {
  status: number | null = null;
  detail: unknown = null;
}
