# my-game-campaigns Specification

## Purpose

My Game > Campaigns (`/my-game/campaigns`) shows how far the player is through the standing campaigns, read from the synced campaign progress: headline counters, one card per campaign with its Standard and Elite tracks, the medals and Lightning Victories recorded per track, and the one-time rewards still to claim.

## Requirements

### Requirement: Campaigns shows four progress counters

The page SHALL open with four counters, in the order of the track cards below: **Normal**, **Normal Elite**, **Mirror** and **Mirror Elite**. Each counter SHALL cover only its own tracks (Normal: the non-Elite tracks of the normal campaigns; Normal Elite: their Elite tracks; likewise for Mirror), so no track counts twice. Each counter SHALL show its completion percent, battles beaten out of battles, how many tracks are cleared, and, when any are recorded, its medals and Lightning Victories. On desktop (at least 1024px) the four counters SHALL sit in one row; below that, in two rows of two.

#### Scenario: Elite tracks have their own counter

- **GIVEN** a player who has beaten all 3 battles of a normal campaign's Standard track and 1 of 2 battles of its Elite track
- **WHEN** they open Campaigns
- **THEN** Normal shows 3/3 and Normal Elite shows 1/2

### Requirement: Campaign percentages round down and name their basis

Every completion percent on the page (the counters, each campaign card and each track) SHALL count medals plus Lightning Victories earned out of those available when medals are recorded for its tracks, and battles beaten out of battles otherwise. It SHALL round down, so 100% means everything is earned. Each counter's percent SHALL carry a design-system tooltip naming its basis, for example "Medals and Lightning Victories earned: 1,832 of 1,840" or "Battles cleared: 460 of 460".

#### Scenario: Nearly complete never reads as complete

- **GIVEN** the Mirror tracks have 1,375 of 1,380 medals and 457 of 460 Lightning Victories
- **WHEN** the player opens Campaigns
- **THEN** Mirror reads 99%, and its tooltip reads "Medals and Lightning Victories earned: 1,832 of 1,840"

### Requirement: Unclaimed one-time rewards stand out

A track with battles whose one-time medal or milestone rewards are not all claimed SHALL show a primary badge with a gift icon, "N battle(s) to claim", that opens the list of those rewards. A track with nothing left to claim SHALL show no line about it. A campaign card SHALL show a badge beside its percent with how many of its battles have rewards to claim ("2 to claim"). While any track has rewards to claim:

- a line under the counters SHALL say in how many tracks ("Unclaimed rewards in 3 tracks");
- the toolbar's Find slot SHALL offer an **Unclaimed rewards** filter chip that, while on, lists only the campaigns with something to claim. The chip's state SHALL be remembered on the device.

While nothing is left to claim, neither the line nor the chip SHALL be shown. The same badge SHALL replace the former muted line on event campaign tracks.

#### Scenario: One battle short of its medals

- **GIVEN** a track whose battles are beaten, one of them recorded at 1 of 3 medals
- **WHEN** the player opens Campaigns
- **THEN** that track shows "1 battle to claim", its campaign card shows "1 to claim", and the line under the counters reads "Unclaimed rewards in 1 track"

#### Scenario: Filtering to campaigns with rewards to claim

- **GIVEN** two campaigns, only one of which has a track with rewards to claim
- **WHEN** the player turns on the Unclaimed rewards chip
- **THEN** only that campaign is listed, and the chip is still on the next time they open Campaigns

#### Scenario: Everything claimed

- **GIVEN** every beaten battle is recorded at its best
- **WHEN** the player opens Campaigns
- **THEN** no track shows a rewards line, and neither the summary line nor the Unclaimed rewards chip is shown
