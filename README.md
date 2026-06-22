# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Authentication configuration

Use the dedicated Microsoft Entra External ID single-page application
registration for each environment and register its matching redirect URI:

- Local: `http://localhost:5173/auth/callback`
- Staging: `<staging-origin>/auth/callback`
- Production: `<production-origin>/auth/callback`

Copy `apps/web/.env.example` to `apps/web/.env.local`, then replace the sample
values with the local API base URL, local delegated `access_as_user` scope,
dedicated local SPA application ID, tenant ID, and CIAM authority. Grant each
SPA registration delegated access to the scope exposed by its matching API
registration. The tenant ID is used to trust the GUID-based issuer returned by
CIAM metadata.

For deployments, define these public configuration values under **Settings →
Secrets and variables → Actions → Variables** in GitHub:

- `STAGE_MSAL_AUTHORITY`
- `STAGE_MSAL_CLIENT_ID`
- `STAGE_MSAL_TENANT_ID`
- `STAGE_API_BASE_URL`
- `STAGE_API_SCOPE`
- `PROD_MSAL_AUTHORITY`
- `PROD_MSAL_CLIENT_ID`
- `PROD_MSAL_TENANT_ID`
- `PROD_API_BASE_URL`
- `PROD_API_SCOPE`

The CD workflows pass the appropriate values into Vite before building the
stage or production artifact. These values are embedded in browser JavaScript
and must not contain secrets. Keep the Azure Static Web Apps deployment tokens
in GitHub Secrets.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```
