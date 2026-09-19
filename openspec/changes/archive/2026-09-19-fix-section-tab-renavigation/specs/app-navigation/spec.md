## MODIFIED Requirements

### Requirement: The shared page header hosts a section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL continue to expose them via a routed tab row directly beneath the header's title and description, replacing any tab row a page previously rendered on its own — unchanged from the original header-tabs design. This applies to every multi-child section, including Dailies. A third level of tabs nested within a specific child page (e.g. Dailies > Raids' own Today/Raids Plan sub-tabs) is out of scope for this requirement and continues to render inside that child page's own content, unaffected.

On desktop, the header no longer hosts a child-page picker at all — a section's child pages are discovered through the desktop sidebar's flyout instead (see the sidebar flyout requirement above), and the desktop header shows only a static breadcrumb (see the breadcrumb requirement above). On mobile, the menu drawer also lists a section's child pages, per the earlier drawer requirement — that duplication with the mobile header's tab row is intentional and out of scope for this capability to remove.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on mobile
- **THEN** the shared header shows a tab row listing every child page of that section directly beneath the title and description, and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: Desktop header offers no child-picker

- **WHEN** a user is on any page within a section that has child pages, on desktop
- **THEN** the shared header shows only the static breadcrumb title (and, beneath it, the active page's description) — no tab row, dropdown, or other interactive picker is rendered in the header

#### Scenario: A third-level tab row is unaffected

- **WHEN** a user is on `/dailies/raids/today` or `/dailies/raids/plan`, on either platform
- **THEN** Raids' own Today/Raids Plan sub-tabs continue to render within the page's own content, below the header, exactly as before this change, unaffected by how the header or sidebar shows Dailies' own child pages

#### Scenario: Activating a tab returns from a route nested below a child page that has its own landing page

- **WHEN** a user is on a route nested below a child page whose own path is a landing page — a project's detail route, or a Library raid boss's detail route — and activates that child page's tab, on mobile
- **THEN** that child page's tab is shown as the active one, and the user is taken to the child page's landing screen: the all-projects screen, or the raid-boss picker

#### Scenario: Activating a tab does nothing for a child page with no landing page of its own

- **WHEN** a user is on a route nested below a child page whose own path is a redirect or canonicalizes to a specific entity — a Library character, Machine of War, or NPC detail route, or a Raids sub-page — and activates that child page's tab, on mobile
- **THEN** no navigation occurs and the user stays on the page they were on

#### Scenario: Activating a tab adds one history entry

- **WHEN** a user activates a tab that takes them somewhere — a different child page, or the landing page of the child page they are nested below — on mobile
- **THEN** exactly one history entry is added, and a single Back press returns them to the page they activated the tab from

#### Scenario: Activating the tab of the exact current page does nothing

- **WHEN** a user is on a child page's own path and activates that page's tab, on mobile
- **THEN** no navigation occurs and the user stays on that page
