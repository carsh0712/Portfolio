# Portfolio MCP Server

MCP server for managing the portfolio API at `https://portpolio.susanghwan.vip`.

## Setup

Install dependencies:

```sh
npm install
```

Build TypeScript:

```sh
npm run build
```

Run locally:

```sh
npm start
```

## Environment

Create `.env` from `.env.example`:

```env
PORTFOLIO_API_BASE_URL=https://portpolio.susanghwan.vip
PORTFOLIO_API_EMAIL=your-email@example.com
PORTFOLIO_API_PASSWORD=your-password
```

Tokens are kept in memory only. The server logs in lazily on the first authenticated API call, refreshes on `401`, and logs in again if refresh fails.

## Codex/Claude MCP Config

Use the absolute path for this workspace:

```json
{
  "mcpServers": {
    "portfolio-api": {
      "command": "node",
      "args": [
        "/Users/carsh0712/Documents/work/susanghwan.vip/Portfolio/portfolio_mcp_server/dist/index.js"
      ]
    }
  }
}
```

## Safety

Delete and account-changing tools require an explicit `confirm: true` input.
