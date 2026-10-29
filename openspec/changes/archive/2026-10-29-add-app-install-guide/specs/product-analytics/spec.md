# Spec Delta

## ADDED Requirements

### Requirement: Installing the app is a declared event

The client SHALL report `app_install_guide_opened` (source `homeCard` or `accountMenu`, the install platform, and whether the browser offered its prompt) when the install guide opens, `app_install_prompt_answered` (source and `accepted` or `dismissed`) when the browser's install prompt is answered, and `app_install_card_dismissed` (the install platform) when Not now hides the Home install card.

#### Scenario: Installing from Home

- **WHEN** an identified user taps Install on the Home card and accepts the browser's prompt
- **THEN** `app_install_prompt_answered` is reported with source `homeCard` and outcome `accepted`
