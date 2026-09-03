# game-shops-catalog Specification

## Purpose

Gives the client game-catalog package its shop data layer: the `shops` dataset (one stored record per
daily shop) and the day-of-week / power-level / lock resolution that turns a stored shop into the
reward offers available on a given day — in a goal-tracking form (today's flattened offers, tagged
guaranteed-vs-random) and a permissive browsing form (any day, every option per slot) — so features
can reason about daily-shop offers without re-implementing shop rotation rules.

## Requirements

### Requirement: The `shops` dataset is synced and stored one record per shop

The client SHALL treat `shops` as a served game-catalog dataset: it participates in the existing
manifest-diff sync, is validated against a schema on download, and is stored in the game-catalog
IndexedDB database as one record per shop (keyed by the shop's `id`), not as a single combined
record. Adding the store SHALL follow the package's version-cascade upgrade mechanism (a bumped
database version with a new complete `stores()` block).

#### Scenario: Shops sync into their own store

- **WHEN** the game catalog completes a sync that includes the `shops` dataset
- **THEN** the `shops` IndexedDB store contains one record per daily shop, each retrievable by its shop id

#### Scenario: Schema rejects a malformed shop payload

- **WHEN** a `shops` dataset payload fails its schema validation
- **THEN** the sync surfaces the failure the same way it does for any other dataset and the store is not left partially written

#### Scenario: Existing databases upgrade without data loss

- **WHEN** a client with an earlier game-catalog database version loads the app after this change
- **THEN** the database upgrades to the new version, the `shops` store is created, and the other datasets' stored records are preserved

### Requirement: A stored shop exposes structured slots, variants, rewards, costs, days, and conditions

Each stored shop record SHALL expose the shop `id`, its refresh metadata, and its ordered slots; each
slot SHALL expose its ordered variants; and each variant SHALL expose a structured reward
(`{ type, qty }`), an optional resolved `unitId` for character-shard rewards, an optional structured
free offer, a cost (`{ currency, amount }`), a per-day purchase cap, an optional draw weight, an
explicit day-of-week availability list, optional power-level bounds, and an optional opaque `lockId`
string. The client SHALL NOT need to parse Quartz cron strings or `"type:qty"` reward strings.

#### Scenario: Variant fields are consumable without further parsing

- **WHEN** a feature reads a stored shop variant
- **THEN** its reward type/quantity, cost currency/amount, available days, and purchase cap are directly available as typed fields

#### Scenario: Character-shard variant carries its unit id

- **WHEN** a stored variant's reward type denotes character shards
- **THEN** the variant also exposes the `unitId` those shards belong to

### Requirement: Shop offers resolve for a given day, power level, and roster context

The package SHALL provide a resolver that, given a stored shop, the current day of week, the player's
power level, and roster context (per-unit stars, whether the roster owns any blue-star-or-above unit,
and the derived power-level tier), returns the reward offers available today — each with its reward,
cost, purchase cap, free offer, and a flag indicating whether the offer is guaranteed today or only a
possible (randomized-slot) outcome. Resolution SHALL match V1's behavior: filter each slot's variants
by day and by power-level bounds, resolve `lockId` against the roster/time context, then group a
slot's surviving variants by reward type — a single resulting type is guaranteed, several is random.

#### Scenario: Day filtering

- **WHEN** the resolver runs for a day not in a variant's availability list
- **THEN** that variant does not appear in the resolved offers

#### Scenario: Power-level filtering

- **WHEN** a variant declares a minimum power level above the player's power level
- **THEN** that variant does not appear in the resolved offers

#### Scenario: Guaranteed vs. possible

- **WHEN** every day-and-condition-matching variant of a slot resolves to the same reward type
- **THEN** that offer is flagged guaranteed today
- **WHEN** a slot's matching variants resolve to more than one reward type
- **THEN** each of those offers is flagged as only possible today

#### Scenario: Lock resolution is roster- and time-aware

- **WHEN** a variant carries a `lockId` expressing a battle-pass-season window, a power-level tier, a per-unit "max legendary" threshold, or an "owns any blue-star unit" condition
- **THEN** the resolver evaluates it against the supplied roster/time context and includes or excludes the variant accordingly

#### Scenario: Unrecognized lock ids follow V1's fallback

- **WHEN** a variant carries a `lockId` the resolver has no rule for
- **THEN** the resolver applies the same default V1 applies for that resolution path (conservative for goal-tracking resolution), rather than throwing

### Requirement: A permissive resolver returns every option per slot for any day

The package SHALL also provide a permissive resolver for reference/browsing use: given a stored shop
and any day of the week (not only today), it returns that day's slots with each slot's mutually
exclusive reward options kept grouped together (not flattened), so a browser can render a slot that
resolves to one of several rewards as a single "one of these" unit. It SHALL NOT require a project,
goal, or player-need context. Roster/lock conditions it cannot resolve without a signed-in roster
SHALL default to "possibly available" (shown) rather than hidden, matching V1's permissive behavior;
an optional power-level and lock context MAY be supplied to narrow the result but SHALL NOT be
required.

#### Scenario: Slots are grouped, not flattened

- **WHEN** the permissive resolver runs for a day on which a slot can yield one of several reward types
- **THEN** that slot is returned as a single group listing all of those reward options, each with its reward, cost, and purchase cap

#### Scenario: Any day can be resolved

- **WHEN** the permissive resolver is asked for a day other than the current day
- **THEN** it returns the slots available on that requested day

#### Scenario: No roster context required

- **WHEN** the permissive resolver is called without a power-level or roster/lock context
- **THEN** it returns every slot available that day, treating roster-dependent lock conditions as possibly available rather than excluding them

#### Scenario: A day with no offers

- **WHEN** a shop has no slots available on the requested day
- **THEN** the permissive resolver returns an empty result for that shop and day

### Requirement: The package exposes a query for reading stored shops

The package SHALL expose a query that returns the stored shop records (and/or a shop-id-keyed map),
consistent with how it exposes every other dataset, so a feature reads shops through the package's
public query surface rather than touching the database directly.

#### Scenario: Shops are read through the package query

- **WHEN** a feature needs the daily shops
- **THEN** it obtains them from the game-catalog package's query surface, and receives every stored shop record
