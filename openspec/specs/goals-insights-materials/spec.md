# goals-insights-materials Specification

## Purpose

Defines the Goals Insights materials card: what the plan still misses, what it requires, and which owned upgrade materials no goal needs, so a player can see every upgrade material one by one instead of a per-rarity total.

## Requirements

### Requirement: The materials card switches between Missing, Required and Spare

The Insights materials card SHALL offer a segmented control with three views: **Missing** (the default), **Required** and **Spare**. The card's title, description and empty text SHALL follow the chosen view. The choice SHALL be remembered per browser and restored on the next visit; an unknown stored value SHALL fall back to Missing.

#### Scenario: The choice is remembered

- **GIVEN** a player who picked Required on the materials card
- **WHEN** they open Insights again
- **THEN** the card shows the Required view

### Requirement: Upgrade materials are listed one by one, grouped by rarity

In every view the card SHALL list base (farmed) upgrade materials one row per material, grouped into sections by rarity from the highest rarity down, each section named "<Rarity> upgrades". It SHALL NOT show a per-rarity upgrades total. Each row SHALL show the material's icon, its name and the view's count. A section SHALL show ten rows, then a "Show N more" button that reveals the rest and a "Show fewer" button that hides them again.

- **Missing**: materials the scoped goals still miss after inventory and suppliers are spent, with the count missing, the days and energy left to farm them ("X d · Y energy", days rounded up), and up to two portraits of the goals' units that need it, then "+N".
- **Required**: materials the scoped goals require (owned crafted upgrades already count, as in Missing), with the required count, "N missing" when part of it is still missing, the days and energy left, and the portraits.
- **Spare**: owned non-crafted materials minus what every active goal requires (all projects, not just the scoped one), shown only when the result is above zero, with the spare count. A material another project needs is never spare.

Within a section Missing and Required sort by days left (slowest first), then by name; Spare sorts by spare count (largest first), then by name.

#### Scenario: A material another project needs is not spare

- **GIVEN** 20 Ceramite owned, a scoped project that needs none, and another project that needs 15
- **WHEN** the player picks Spare
- **THEN** Ceramite shows 5 spare

#### Scenario: Required shows what is still missing

- **GIVEN** the scoped goals require 500 Ceramite and 265 are still missing
- **WHEN** the player picks Required
- **THEN** the Ceramite row shows 500 and "265 missing"

### Requirement: The other farmed resources show under Missing only

Shards, ability badges, orbs, Machine of War materials, XP books and gold SHALL keep their existing tile groups and SHALL show only in the Missing view. Required and Spare SHALL list upgrade materials only.

### Requirement: A material row opens its material details

Each row's material icon SHALL open the same material details as the Raids Plan's material cells (`daily-raids-plan`), computed for the current project. The details SHALL load the raid plan only when opened and show a placeholder while it loads, and a short "unavailable" text when the plan can't be built.
