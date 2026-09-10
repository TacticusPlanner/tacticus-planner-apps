## Context

See the proposal and spec. This change follows `share-guild-access-onboarding`, so `/dailies/guild-raids` already has an access-gated page shell. The companion API adds an id-only normalized status endpoint. Raid-boss presentation helpers and reactive catalog queries already exist; player-data `live-progress` already stores raid and bomb token buckets.

The V1 Guild Performance overview supplies useful boss-order/HP/modifier behavior, but its analytics tabs, raw hits, filters, and shared leaderboards are outside this Dailies workflow.

## Goals / Non-Goals

**Goals:**

- Render trustworthy current boss context and personal resources from their existing owners.
- Preserve cached information through background refresh and source outages.
- Make the status easy to scan on both app layouts.

**Non-Goals:**

- Porting the V1 Guild Performance dashboard.
- Computing boss order/modifier state in the browser from raw hits.
- Recommending or ranking teams.

## Decisions

### Add an `entities/guild-raid-status` boundary

The entity owns the API DTO, mapper, query options, freshness constants, and id-only domain status. It exposes a public query factory and mapped status types. The Dailies page owns layout and composes existing `entities/raid-boss` presentation helpers. Player resource reads remain in `packages/player-data`; status and resources are composed only at the page/widget boundary.

This avoids extending `entities/guild` with encounter concerns and avoids page-local network types.

### Let the API own raid normalization and the query own revalidation

TanStack Query uses a five-minute `staleTime`, shows retained data during refetch, and relies on the API's persisted per-guild/per-season observation plus same-guild single-flight behavior. The manual action calls the same endpoint with forced refresh and is disabled by mutation/query pending state. It does not invalidate guild membership or player data.

### Use one canonical page view model

A page-level mapper combines mapped status, raid-boss presentation, and token buckets into a single discriminated view model. Desktop and mobile renderers consume that structure; countdown labels and summaries derive from it rather than recomputing source values independently.

### Desktop and mobile are separate presentation components

Desktop uses a primary boss card with adjacent progression and modifier cards. Mobile leads with boss/HP, follows with compact resource/progression cards, and collapses modifier detail. The shared page chooses with `useIsMobile()`. Both variants expose stable test ids, with separate Joyride arrays where targets differ.

### Countdown behavior is observation-anchored

Season remaining time counts down only from a non-null API `endsAt`. Token/bomb countdowns subtract elapsed time since the player snapshot observation, floor at zero, and then mark the value due/stale rather than incrementing the token count locally. A new player sync is the only source of a higher authoritative token count.

### State composition keeps independent data useful

Guild access gates the page. Status loading/error/no-season/mapping-warning branches do not hide valid personal resources. Missing player tokens prompt player-data sync without hiding guild status. A stale API response stays rendered with its `observedAt` warning.

### V1 parity checklist

- Current boss navigation and HP: keep the behavior, but consume the V2 normalized endpoint instead of raw-hit calculations; omit subsequent-boss preview from this slice.
- Prime modifier progress/thresholds: keep, redesigned as concise status detail; use V2 id-based labels/icons.
- Season/player selectors: drop from this current-only Dailies slice.
- Overview, Damage, Performance, Leaderboards, Loops, Token Usage, Historical tabs: drop; they belong to deferred guild analytics.
- Raw hit tables, multi-player filters, tooltips tied to analytics: drop.
- No-season, unknown boss/config, no-hit/full-HP, stale/error states: keep and redesign explicitly.
- V1 asset paths: do not copy; reuse the V2 raid-boss id-to-portrait resolver and local modifier translations.
- Raid/bomb resources: redesign from V1's token-usage emphasis into a personal, compact decision aid.

## Risks / Trade-offs

- [Risk] API and local catalog versions disagree → Render basic server values/readable ids and a catalog warning; never substitute another boss.
- [Risk] Countdown values look live after their source is stale → Anchor them to observation timestamps and label due/stale rather than predicting regenerated inventory.
- [Risk] Independent status/player-data refresh times confuse users → Show each source's relevant freshness/sync action separately.

## Migration Plan

Deploy the companion API first. Add the entity/query and page view model, then replace the shell's neutral ready content with responsive status/resources. Rollback restores the ready shell; no local storage migration is required.
