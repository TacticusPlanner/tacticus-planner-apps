## ADDED Requirements

### Requirement: CE nodes first quick filter

Today's quick filters SHALL include a **CE nodes first** chip. It SHALL be offered only while live progress names an active campaign event and the player has reached at least one of its nodes (per "Only the active campaign event is farmable"), and also while it is on so it can be turned off. Like the other chips it SHALL be remembered per device, carry a tooltip and show a note line while on.

While it is on and the active event has reached nodes, when choosing the nodes for a material Today SHALL first keep only the active event's reached nodes that pass the Raids Filters (and "Raidable only"). If any remain, the usual pick (least energy per item, then Fewer raids, then expected gold) SHALL run among those only, even when a standing node costs less energy per item. If none remain, the usual pick SHALL run over every node. A goal's pinned farm locations SHALL be used as chosen. It SHALL change only Today's plan and Bonus Raids, like the other chips. The HSE and HRE tabs SHALL hide it and compute as if it were off.

#### Scenario: A material that drops in the running event is farmed there

- **GIVEN** a campaign event is running and the player has reached a node of it that drops a needed material at 10 energy per item, while a standing node drops it at 6
- **WHEN** CE nodes first is on
- **THEN** Today raids the event node for that material, and materials the event does not drop are raided at their usual nodes

#### Scenario: No running event

- **GIVEN** live progress names no active campaign event
- **WHEN** Today loads with CE nodes first off
- **THEN** the chip is not offered
