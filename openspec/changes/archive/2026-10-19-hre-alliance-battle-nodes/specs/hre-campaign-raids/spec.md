## MODIFIED Requirements

### Requirement: Raid suggestions appear only for a current campaign objective

The raid suggestions section SHALL be shown on a running HRE when the current mission has an objective of kind `campaignWins` ("Win N campaign battles"), `campaignRaids` ("Raid N campaign battles"), `lightningVictories` ("Win N lightning victories"), `winWithAllianceLineup` ("Win N battles with an all-alliance team") or `useAbilitiesAlliance` ("Use N abilities with alliance units") whose progress is below its target. A lightning objective comes first, then a campaign one, then the all-alliance wins, then the ability uses. The battles still needed SHALL be the target minus the recorded progress; for ability uses, one battle per 5 uses still needed (one use for each of five units). Otherwise, the section SHALL name the next mission that has a campaign objective and its target, or say that no campaign missions are left. It SHALL NOT list raids for a later mission.

Assumptions:

- A raid counts as a won campaign battle, so it advances both `campaignWins` and `campaignRaids` objectives by one.
- Mission progress counts only while that mission is the current one; battles done earlier do not carry forward.

#### Scenario: Mission 5 in progress

- **GIVEN** the current mission is 5 with 37 / 100 campaign wins
- **THEN** the section is titled "Raids for mission 5" and shows "63 battles to go"

#### Scenario: Current mission has no campaign objective

- **GIVEN** the current mission is 6 ("Heal or repair 2,500 health" and "Win 10 battles without summoning")
- **THEN** no raid list is shown, and the section reads "Next campaign mission: 16, Raid 25 campaign battles"

#### Scenario: Campaign objective already met

- **GIVEN** mission 5 at 100 / 100 campaign wins, with its other objective still open
- **THEN** no raid list is shown, and the section says the campaign objective is complete

#### Scenario: Preview event

- **GIVEN** the tab previews an upcoming HRE
- **THEN** no raid list is shown; only the remaining-campaign summary (see below) is shown, from mission 1

### Requirement: Alliance objectives get raids or battles

For `winWithAllianceLineup` the section SHALL be titled "Battles for mission N" and list nodes of any slot count where that alliance can deploy, to fight by hand with an all-alliance team of the featured hero's alliance, because raids have no lineup and do not count; the note SHALL add that Arena wins with that team count too. For `useAbilitiesAlliance` the section SHALL be titled "Battles for mission N" and list only nodes with 5 deployment slots where that alliance can deploy (replacing the Raids Filters' slot and allies-alliance choices), to fight by hand with a full alliance team; its note SHALL add that ability uses in Salvage Runs and other modes count too. Both are ordered and filled as raids are.

#### Scenario: Mission 10

- **GIVEN** mission 10 with 5 / 15 all-Xenos wins
- **THEN** the section is titled "Battles for mission 10", shows "10 battles to go", says raids do not count and lists nodes of every slot count where Xenos can deploy

#### Scenario: Mission 7

- **GIVEN** mission 7 with 0 / 20 alliance ability uses
- **THEN** the section is titled "Battles for mission 7", shows "4 battles to go", lists only 5-slot nodes where Xenos can deploy and says Salvage Run ability uses count too

#### Scenario: Mission 7 part done

- **GIVEN** mission 7 with 12 / 20 alliance ability uses
- **THEN** the section shows "2 battles to go"
