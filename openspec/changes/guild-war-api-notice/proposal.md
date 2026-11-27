## Why

The Tacticus API returns no Guild War data, so every attack on Offense is logged by hand. Players are already asking whether the summary strip updates from the API. V1 answered this with a banner on its War Offense page; V2 has none.

## What Changes

- A dismissable note at the top of the Guild War pages (Offense and History): "The Tacticus API doesn't return Guild War data, so attacks are logged by hand here."
- Dismissing it hides it on that device for good (`tp.dismissed.guildWarApiNotice`).

## Capabilities

### Modified Capabilities

- `guild-war-offense`: the Guild War pages show the dismissable note about manual logging.

## Impact

- `apps/web`: the Guild War layout, a new storage field in the `dismissed` preference record, and two `guildWar` locale keys in every locale. No API change.
