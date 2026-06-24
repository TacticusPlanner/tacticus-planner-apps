# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Authentication configuration

Create a Microsoft Entra External ID single-page application registration and
register these redirect URIs:

- Local: `http://localhost:5173/redirect`
- Production: `<production-origin>/redirect`

Copy `apps/web/.env.example` to `apps/web/.env.local`, then replace the sample
values with the new registration's application ID, tenant ID, and CIAM
authority. The authority must use the form
`https://<tenant-subdomain>.ciamlogin.com/`. The tenant ID is used to trust
the GUID-based issuer returned by CIAM metadata.

Set `VITE_API_BASE_URL` to the planner API origin and `VITE_API_SCOPE` to the
API permission scope used by the SPA, for example
`api://<api-application-id>/access_as_user`.

For deployments, define these public configuration values under **Settings →
Secrets and variables → Actions → Variables** in GitHub:

- `STAGE_MSAL_AUTHORITY`
- `STAGE_API_BASE_URL`
- `STAGE_API_SCOPE`
- `STAGE_MSAL_CLIENT_ID`
- `STAGE_MSAL_TENANT_ID`
- `PROD_MSAL_AUTHORITY`
- `PROD_API_BASE_URL`
- `PROD_API_SCOPE`
- `PROD_MSAL_CLIENT_ID`
- `PROD_MSAL_TENANT_ID`

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
