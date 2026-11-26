## MODIFIED Requirements

### Requirement: Non-recoverable errors show a branded fallback page

When rendering a route throws an error that is not a stale-build failure, the app SHALL render its own fallback error page in the app's visual style and current language instead of the routing library's default error output. The page SHALL state that something went wrong, SHALL offer a Reload action and a Go to Home action, and SHALL offer a Report a bug action that opens the feedback widget's submit form (see `userjot-widget`), since the page replaces the shell and its feedback button. It SHALL NOT show a raw stack trace to the user; the error SHALL be written to the browser console for diagnosis.

#### Scenario: Render error inside a page

- **WHEN** a component on the Dailies page throws during render
- **THEN** the fallback page replaces the page content, the error is logged to the console, and the user can choose Reload or Go to Home

#### Scenario: Fallback page is translated

- **GIVEN** the user's language is German
- **WHEN** the fallback page is shown
- **THEN** its heading, description, and both actions are in German

#### Scenario: Go to Home from the fallback page

- **WHEN** the user chooses Go to Home on the fallback page
- **THEN** the app navigates to `/home` and renders it normally without a full page reload

#### Scenario: Report a bug from the fallback page

- **WHEN** the user chooses Report a bug on the fallback page
- **THEN** the feedback widget opens on its submit form over the fallback page
