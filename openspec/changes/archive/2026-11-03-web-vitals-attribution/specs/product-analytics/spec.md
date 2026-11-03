# Spec Delta

## ADDED Requirements

### Requirement: Web vitals are reported with diagnostic attribution

While a user is identified, the client SHALL report Core Web Vitals (CLS, INP, LCP, FCP) for the pages they use, each labelled with the route pattern of the page the metric was measured on. CLS, INP and LCP SHALL carry diagnostic attribution limited to element selectors, the interaction type, the LCP resource URL without its query string, and timing values. Attribution SHALL NOT include text content, input values or any URL parameter or query values.

#### Scenario: A metric is sent after the user has moved on

- **GIVEN** an identified user loads `/library/characters/abc-123` and navigates to `/home` before that page's LCP is sent
- **WHEN** the LCP metric is reported
- **THEN** it is reported against `/library/characters/:entityId`, not `/home`

#### Scenario: A layout shift is attributed

- **WHEN** a CLS value is reported for an identified user
- **THEN** it carries the selector of the element with the largest shift, its time and its value, and no text from the page

#### Scenario: A slow interaction is attributed

- **WHEN** an INP value is reported for an identified user
- **THEN** it carries the selector of the interaction target, the interaction type and the input-delay, processing and presentation timings, and no input value
