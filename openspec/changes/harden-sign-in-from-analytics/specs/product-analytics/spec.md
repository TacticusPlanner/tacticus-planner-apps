## MODIFIED Requirements

### Requirement: Sign-in steps are reported once identified

The client SHALL record each step the sign-in machinery takes on the device (the cached-token restore, the hidden-frame check, a quiet renewal started, skipped or returned, an interactive redirect started or returned) and SHALL report them as `auth_step` events only once the user is identified, each dated when it happened and grouped by page load. A step carries its name, outcome, protocol error code (MSAL's code plus Entra's AADSTS code, never the error message), and, where they apply, whether it started from a cached account or a remembered hint, why a renewal was skipped, whether an interactive redirect was started by the app or the user, the sign-in method (on return steps too: from the account hint, or the account the redirect signed in) and whether a fresh login was asked for. A return step also carries how the page it was read on was loaded (`navigate`, `reload` or `back_forward`), and every step carries the build version that recorded it, which can differ from the build that later sends it. It SHALL NOT carry a username, login hint, token, URL or error message. The device keeps at most 60 steps from the last 7 days, sends each once, and drops them on sign-out.

#### Scenario: A sign-in loop is reported after the user signs in by hand

- **WHEN** a returning user's restore fails, a quiet renewal comes back without a session and the app starts an interactive redirect, and the user then signs in
- **THEN** once they are identified, each of those steps is reported as `auth_step` with its outcome and error code, dated when it happened

#### Scenario: A redirect response never arrives

- **WHEN** a redirect left the page and the page it returns to finds no response
- **THEN** a `no_response` return step is recorded

#### Scenario: Nobody signs in afterwards

- **WHEN** the recorded steps end with the visitor signed out and nobody signs in on the device
- **THEN** nothing is reported, and steps older than 7 days are dropped

#### Scenario: A redirect response never arrives because the page reloaded

- **WHEN** a Google user's automatic redirect is interrupted by a reload of the page it left
- **THEN** the `no_response` return step carries the method `google`, the navigation type `reload` and the build that recorded it
