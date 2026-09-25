# account-setup Specification

## Purpose

Defines the blocking first-run screen that connects a signed-in user's Tacticus account to the
planner — how it presents on desktop and mobile, the two paths available (paste an API key, or
import one from the V1 planner), how each path's outcome is reported including a V1 import that
succeeds without yielding a usable key, and how a user who wants neither path can leave.

## Requirements

### Requirement: Account setup blocks protected content until a Tacticus API key is configured

A signed-in user without a configured Tacticus API key or without an application display name SHALL be sent to account setup instead of protected route content. Once both are present, protected content SHALL be shown and setup SHALL NOT reappear. While account state is being determined, the system SHALL show neither protected content nor setup, and SHALL NOT navigate; if account state cannot be determined, the system SHALL fail open, show protected content, and SHALL NOT navigate.

#### Scenario: Unconfigured user is sent to setup instead of protected content

- **WHEN** a signed-in user with no configured Tacticus API key opens a protected route
- **THEN** they are taken to account setup and the route's own content is not shown

#### Scenario: Configured user is shown protected content

- **WHEN** a signed-in user with a configured Tacticus API key and a display name opens a protected route
- **THEN** the route's content is shown and account setup is not

#### Scenario: Account state still loading

- **WHEN** a signed-in user opens a protected route and their account state has not yet resolved
- **THEN** a loading indicator is shown, neither setup nor route content is shown, and no navigation occurs

#### Scenario: Account state cannot be determined

- **WHEN** the request for the signed-in user's account state fails
- **THEN** the route's content is shown rather than setup, and no navigation occurs, so a transient failure does not lock the user out of the app

#### Scenario: Key exists but no name is set

- **WHEN** a signed-in user with a configured key but no display name opens a protected route
- **THEN** they are taken to the name step and the route's own content is not shown

### Requirement: Account setup is addressable, with an address per step

The account setup screen SHALL have its own address, and on viewports below 768px each of its
steps SHALL have its own distinct address. Navigating between steps SHALL change the address, so
that the browser's Back control moves between steps and reloading the page returns to the same
step. Setup addresses SHALL require authentication exactly as protected routes do.

#### Scenario: Each mobile step has its own address

- **WHEN** an unconfigured signed-in user moves from the choice step to a form step at 390px wide
- **THEN** the address changes to one specific to that step

#### Scenario: Browser Back moves between steps

- **WHEN** the user activates the browser's Back control on a form step at 390px wide
- **THEN** the choice step is shown

#### Scenario: Reloading keeps the current step

- **WHEN** the user reloads the page while on a form step at 390px wide
- **THEN** that same form step is shown again

#### Scenario: Unauthenticated visitor cannot reach setup

- **WHEN** a visitor who is not signed in opens a setup address
- **THEN** they are redirected away exactly as they would be from any protected route

### Requirement: Completing setup returns the user to the route they originally asked for

When a user is sent to setup from a protected route, that destination SHALL be remembered and the
user SHALL be taken to it on successful completion, without a full page reload. The remembered
destination SHALL survive navigation between setup steps and a page reload. It SHALL be accepted
only when it is a relative path within this application and does not itself point at a setup
address; any other value SHALL be ignored in favour of a safe default destination, so that a
crafted setup link cannot redirect a user to another site or back into setup.

The user SHALL be taken to the destination only once the refreshed account state confirms that a
key is configured — never on the strength of a submission alone, which would risk arriving at a
protected route whose own check still sees the pre-submission state and sends the user back. Until
that confirmation arrives the screen SHALL continue to indicate that the submission is in
progress. If the account state cannot be refreshed after an otherwise successful submission, the
screen SHALL offer a way to retry rather than indicating progress indefinitely.

#### Scenario: Deep link is restored after setup

- **WHEN** an unconfigured signed-in user opens a protected deep link, is sent to setup, and
  completes it
- **THEN** that deep link's own content is shown immediately afterwards

#### Scenario: Remembered destination survives steps and reload

- **WHEN** the user moves between setup steps and reloads the page before completing setup
- **THEN** completing setup still returns them to the originally requested destination

#### Scenario: Off-site destination is refused

- **WHEN** setup is reached through a link whose remembered destination points at another site or
  is otherwise not a relative path within this application
- **THEN** completing setup takes the user to the application's default signed-in destination
  instead, and never to the supplied address

#### Scenario: Setup reached directly has a default destination

- **WHEN** a user reaches setup without a remembered destination and completes it
- **THEN** they are taken to the application's default signed-in destination

#### Scenario: A remembered destination pointing back at setup is refused

- **WHEN** setup is reached through a link whose remembered destination is itself a setup address
- **THEN** completing setup takes the user to the application's default signed-in destination
  rather than back to setup

#### Scenario: Account state cannot be refreshed after a successful submission

- **WHEN** a user submits a key successfully but the refreshed account state cannot be retrieved
- **THEN** the screen offers a way to retry, and does not indicate progress indefinitely

### Requirement: A user who has already completed setup is sent away from it

A signed-in user with a configured Tacticus API key SHALL NOT be shown the account setup screen at
any of its addresses. This SHALL take effect only once the account state is known: while it is
loading, or if it cannot be determined, the system SHALL NOT navigate away from setup, so that the
setup screen and the protected routes cannot redirect to one another indefinitely.

#### Scenario: Configured user opening a setup address is redirected

- **WHEN** a signed-in user with a configured Tacticus API key opens a setup address
- **THEN** they are taken away from setup rather than shown it

#### Scenario: Setup does not bounce while the account state is unknown

- **WHEN** a user is on a setup address and the account state is still loading, or the request for
  it has failed
- **THEN** no navigation away from setup occurs

### Requirement: Account setup renders as in-flow page content on its own minimal chrome

The account setup screen SHALL render as ordinary page content. It SHALL NOT render as a modal
overlay, SHALL NOT suppress page scrolling, and SHALL NOT place any control beyond the reach of
normal page scrolling. Every control on the screen, including its submit control, SHALL be
reachable by scrolling the page on a viewport whose height is smaller than the screen's content,
and SHALL NOT be obscured by the device's bottom safe-area inset.

It SHALL NOT render inside the application's main navigation shell. A user on this screen has no
configured API key, so the shell's affordances are unusable or misleading: its navigation leads
only to protected routes that send the user straight back here, and its background data loading
reports failures caused by the very key this screen is asking for.

#### Scenario: Content taller than a small viewport remains reachable

- **WHEN** an unconfigured signed-in user views the account setup screen on a viewport shorter
  than the screen's content
- **THEN** the page scrolls, and the submit control can be brought fully into view and activated

#### Scenario: Submit control clears the device's bottom inset

- **WHEN** the account setup screen is scrolled to its end on a viewport below 768px wide
- **THEN** the submit control is fully visible above the bottom safe-area inset, not underneath it

#### Scenario: The application's main navigation is absent

- **WHEN** an unconfigured signed-in user views the account setup screen at any viewport
- **THEN** the main navigation, the create-goal control, the navigation search and the Tacticus
  sync control are not shown, and no data-sync failure caused by the missing key is reported on
  the screen

### Requirement: Desktop presents both setup paths at once

On viewports at or above 768px wide the account setup screen SHALL present both paths
simultaneously as two side-by-side panels within a single step. It SHALL NOT require the user to
choose a path before seeing its fields, and SHALL make clear that completing either panel alone is
sufficient.

Because desktop has no separate steps, every setup address SHALL render this same screen at these
viewports, and opening a per-step address SHALL NOT cause a redirect. A change of viewport that
switches between the desktop and mobile presentations MAY discard values already entered.

#### Scenario: Both paths are visible without a choice step

- **WHEN** an unconfigured signed-in user views the account setup screen at 1280px wide
- **THEN** the API key fields and the V1 import fields are both visible at the same time, side by
  side, each with its own submit control, and no path-choice step is shown

#### Scenario: A per-step address renders the whole screen on desktop

- **WHEN** a signed-in user opens a per-step setup address at 1280px wide
- **THEN** the two-panel screen is shown at that address, with no redirect and therefore exactly
  one page-view reported for it

#### Scenario: Crossing the breakpoint mid-flow may discard entered values

- **WHEN** a user who has typed into a setup form changes the viewport across 768px so that the
  other presentation is selected
- **THEN** the presentation for the new viewport is shown, and any values already typed may be
  cleared

### Requirement: Mobile splits setup into a choice step and a form step

On viewports below 768px wide the account setup screen SHALL present a first step naming the two
paths and nothing else, and SHALL show a path's fields only after the user selects that path. Each
step SHALL have its own address. The form step SHALL provide a control returning to the choice step
and SHALL indicate the user's position in the two-step flow. Field values SHALL NOT persist across
a departure from a form step: re-entering a path SHALL present its fields empty, whether it was
left through the in-screen control or the browser's Back control.

#### Scenario: Choice step precedes any fields

- **WHEN** an unconfigured signed-in user views the account setup screen at 390px wide
- **THEN** the two paths are offered as a choice, and no API key, username, or password field is
  shown until one is selected

#### Scenario: Selecting a path shows only that path's fields

- **WHEN** the user selects the V1 import path on the choice step
- **THEN** only the V1 import fields are shown, together with a control returning to the choice
  step and an indication that this is the second of two steps

#### Scenario: Returning to the choice step discards entered values

- **WHEN** the user enters values on a form step, returns to the choice step, and selects the same
  path again
- **THEN** that path's fields are presented empty

#### Scenario: Leaving via the browser Back control also discards entered values

- **WHEN** the user enters values on a form step, leaves it with the browser's Back control, and
  selects the same path again
- **THEN** that path's fields are presented empty

### Requirement: Pasting a valid Tacticus API key completes setup

Submitting a Tacticus API key SHALL complete setup only when the key is accepted. A rejected key
SHALL leave the user on the same form with an explanation and their entered values intact. The
Tacticus user ID field SHALL be optional, and leaving it empty SHALL NOT clear a user ID already
stored for the account.

#### Scenario: Accepted key completes setup

- **WHEN** the user submits a Tacticus API key that is accepted
- **THEN** setup completes and the originally requested route's content is shown

#### Scenario: Rejected key keeps the user on the form

- **WHEN** the user submits a Tacticus API key that is rejected
- **THEN** an explanation is shown on that form, setup does not complete, and the values the user
  entered are still present

#### Scenario: Empty user ID preserves a stored one

- **WHEN** the user submits an API key while leaving the Tacticus user ID field empty, and a user
  ID is already stored for the account
- **THEN** the stored user ID is retained rather than cleared

### Requirement: A V1 import completes setup only when it yields a usable API key

Importing from the V1 planner SHALL complete setup only when the import actually results in a
usable Tacticus API key being configured. An import that is otherwise successful but does not
yield a usable key SHALL NOT be treated as completion, and SHALL report in place why it did not,
distinguishing at least: the V1 account holds no Tacticus API key; the V1 account's key was
rejected; and the key could not be saved. Invalid V1 credentials SHALL be reported on the same
form. The outcome of parts other than the API key SHALL NOT be reported on this screen.

After any outcome that does not complete setup, the form SHALL return to a submittable state — its
submit control enabled and no longer indicating progress — so the user can correct their input and
try again. A non-completing outcome SHALL NOT leave the form indicating an in-flight submission.

#### Scenario: Import yielding a usable key completes setup

- **WHEN** the user submits V1 credentials and the import configures a usable Tacticus API key
- **THEN** setup completes and the originally requested route's content is shown

#### Scenario: V1 account holds no API key

- **WHEN** the import succeeds but the V1 account holds no Tacticus API key
- **THEN** setup does not complete, and a message on the import form states that the V1 account has
  no Tacticus API key saved

#### Scenario: V1 account's API key is rejected

- **WHEN** the import succeeds but the Tacticus API key held by the V1 account is rejected
- **THEN** setup does not complete, and a message on the import form states that the key on the V1
  account is no longer valid, distinct from the message shown when no key exists at all

#### Scenario: Invalid V1 credentials

- **WHEN** the user submits V1 credentials that are not valid
- **THEN** setup does not complete and the credential failure is reported on the import form

#### Scenario: A non-completing outcome leaves the form usable

- **WHEN** an import returns any outcome that does not complete setup
- **THEN** the import form's submit control is enabled again and no longer indicates progress, and
  the outcome message is visible

#### Scenario: Other imported parts are not reported

- **WHEN** an import configures a usable API key but a non-key part such as the Tacticus user ID
  did not import
- **THEN** setup completes and no report of that part's outcome is shown on this screen

### Requirement: A failed V1 import offers the API key path on mobile

Below 768px wide, the message shown when a V1 import does not yield a usable API key SHALL include
an action taking the user directly to the API key step, without passing back through the choice
step. At or above 768px wide no such action is required, because the API key fields are already
visible alongside the import fields.

#### Scenario: Mobile message offers a direct route to the API key step

- **WHEN** a V1 import at 390px wide reports that no usable API key was obtained
- **THEN** the message includes an action that, when activated, shows the API key step directly

#### Scenario: The offered action does not advance on its own

- **WHEN** a V1 import at 390px wide reports that no usable API key was obtained
- **THEN** the import form remains shown with its message until the user activates that action

### Requirement: Account setup always offers a way to sign out

The account setup screen SHALL offer a sign-out control at all times — on the desktop layout and on
every step of the mobile layout — so a user who wants neither path is not trapped. Activating it
SHALL sign the user out of the application.

#### Scenario: Sign out is available on the desktop layout

- **WHEN** an unconfigured signed-in user views the account setup screen at 1280px wide
- **THEN** a sign-out control is visible

#### Scenario: Sign out is available on every mobile step

- **WHEN** an unconfigured signed-in user views the choice step, the API key step, or the V1 import
  step at 390px wide
- **THEN** a sign-out control is visible on each

#### Scenario: Signing out leaves the setup screen

- **WHEN** the user activates the sign-out control on the account setup screen
- **THEN** the user is signed out and the account setup screen is no longer shown
