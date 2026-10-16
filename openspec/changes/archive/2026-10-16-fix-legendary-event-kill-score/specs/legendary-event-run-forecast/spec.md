# Spec Delta

## MODIFIED Requirements

### Requirement: Run-by-run forecast from the token plan

The planner SHALL spend the token plan's tokens in order across the runs that are not Done, each run taking up to its supply, and SHALL carry, from the synced base (points P, currency in hand C, chests claimed K, shards S, as in the reward projection; zeros without a synced entry), per run in order:

- points += the points of the tokens the run uses;
- currency += for each points milestone of the event's `rewards.pointsMilestones` crossed in the run, `engramPayout` + the run's payout bonus (Now: synced `extraCurrencyPerPayout` when > 0, else 15 when the premium track is planned for it; Planned: 15 when its stored premium missions > 0); for Planned runs only, + (regular + premium missions) × (25, + 15 with premium missions) + the bundle (300, + 15 with premium missions) when bought, with paid inputs read as 0 when Show paid options is off;
- chests: while the next chest's `engramCost` ≤ currency, open it (currency −= its cost, shards += `shardsPerChest`);
- shards += the run's stored Oh So Close shards (Planned runs only, paid options on);
- the **next step** is the first cumulative ascension threshold (unlock, + four stars, + five stars, + blue star, + mythic, + two blue stars) above the shards, with the shards still missing; "every step reached" when none;
- an **Oh So Close hint** when 0 < shards missing ≤ 75: its blackstone price is 500 + 100 per shard for Unlock, 500 + 50 per shard for later steps.

Each run reports: tokens available, tokens the plan uses, tokens left over, points earned and ending points, currency earned and ending currency, chests opened and the total claimed, ending shards, the steps reached in the run, the next step with shards missing, and the hint. All figures are in event units (tokens, points, currency, chests, shards), anchored to current synced progress, the plan's current teams and depths, and the stored run inputs.

Assumptions:

- Inputs for the current and earlier runs are already in the synced currency, chests and shards (as in the reward projection) and are not added again.
- Every chest is opened as soon as currency covers it, in ladder order; currency carries across runs.
- A token earns exactly its planned points; tokens beyond the plan earn nothing.
- Oh So Close shards are entered by the user per run; the hint only reports the price, it never buys.

#### Scenario: Worked forecast on Uthar

- **GIVEN** the worked token plan (6 tokens, 1,136 points from 5,000) and the worked supply (run 2: 32, run 3: 68), synced C 120, K 10, S 250, `votanUthar`'s ladder (chests 11, 12, 13, 14 cost 260, 280, 300, 320; milestone 13 at 5,500 pays 85, milestone 14 at 6,000 pays 90), unlock 400, and Stage 3's run 3 inputs (10 regular missions, bundle bought, no premium, no Oh So Close shards) with Show paid options on
- **WHEN** the forecast is computed
- **THEN** run 2 uses 6 of 32 tokens (26 left over), earns 1,136 points to 6,136, crosses milestones 13 and 14 (+85 and +90, no bonus) for 295 currency, opens chest 11 (260; 35 left), ends with 11 chests and 275 shards, next step Unlock with 125 shards missing and no Oh So Close hint (125 > 75)
- **AND** run 3 uses 0 of 68 tokens (68 left over), earns 0 points (6,136), gains 10 × 25 = 250 from missions and 300 from the bundle (585 in hand), opens chest 12 (280; 305 left) and chest 13 (300; 5 left), ends with 13 chests and 325 shards, next step Unlock with 75 shards missing and an Oh So Close hint of 500 + 75 × 100 = 8,000 blackstone

#### Scenario: Oh So Close hint

- **GIVEN** a run ends with 340 shards on an event whose unlock is 400
- **WHEN** the forecast is computed
- **THEN** that run's hint offers 60 shards for 500 + 60 × 100 = 6,500 blackstone

#### Scenario: Plan longer than the run

- **GIVEN** a plan of 40 tokens and a Now run with 32 tokens
- **WHEN** the forecast is computed
- **THEN** the Now run uses 32 tokens and 0 are left over; the next run starts with token 33

#### Scenario: Paid options off

- **GIVEN** run 3 stores premium missions and the bundle while Show paid options is off
- **WHEN** the forecast is computed
- **THEN** run 3 has no bonus-delivery tokens, no payout bonus, no premium mission or bundle currency, and no Oh So Close shards

#### Scenario: V1 parity

- **GIVEN** the cases of V1 `le-round-outcome-forecast.service.spec.ts` and `le-token-service.spec.ts` translated to V2 inputs
- **WHEN** supply and forecast are computed
- **THEN** each figure equals V1's, except where a design deviation (design D3) is pinned by its own case

### Requirement: Run forecast section

Below the token plan the Overview tab SHALL show a collapsible **Run forecast**, collapsed by default and remembered per device, headed by the last forecast run's outcome ("By the end of run 3: 6,136 points · Unlock 75 shards short"). Expanded, it SHALL show one block per run 1–3 with its state (Done, Now, Next, Planned); Done blocks show "Finished" only; other blocks show tokens available as free + ad + bonus delivery, "uses N" and "N left over", ending points, currency, chests, shards, the steps reached, the next step with shards missing, and the Oh So Close hint when present. When any run has tokens left over and the plan is shorter than the supply, a line SHALL say "N tokens with nothing to play: add a team or raise a depth to use them" linking to the first lane with points left. An **Edit inputs** link SHALL open the Stage 3 run inputs drawer (which carries Show paid options); the forecast recomputes when the drawer saves. With an empty plan the forecast SHALL still render (inputs alone can open chests). While supply inputs load the section SHALL show a skeleton; when the event's catalog record failed to load it SHALL be hidden with the Run status card's failure note.

#### Scenario: Forecast header on the worked example

- **WHEN** the Overview renders the worked forecast
- **THEN** the collapsed header reads "By the end of run 3: 6,136 points · Unlock 75 shards short"

#### Scenario: Leftover tokens line

- **WHEN** the worked forecast is expanded
- **THEN** it shows "94 tokens with nothing to play: add a team or raise a depth to use them" linking to Alpha's Teams section

#### Scenario: Desktop layout

- **WHEN** the forecast is expanded at or above 768px
- **THEN** the three run blocks sit side by side in run order

#### Scenario: Mobile layout

- **WHEN** the forecast is expanded below 768px
- **THEN** the run blocks stack in run order, the Now (or Next) block open and the others collapsed to their state and ending points, with no horizontal scroll
