## 1. Decompose the rank range's crafted upgrades

- [x] 1.1 Replace `countOccurrences` in `characterRelevantUpgradeQuantities` with the shared
      recursive `aggregateBaseUpgrades` reduction, and verify a unit test asserts an
      all-crafted rank step now yields its base ingredients with summed quantities
- [x] 1.2 Apply the same reduction to `mowRelevantUpgradeQuantities` and verify a unit test
      covers a MoW ability recipe's crafted ingredient
- [x] 1.3 Delete `countOccurrences` and verify no caller remains

## 2. Surface the blocked-submission reason

- [x] 2.1 Add an `upgradeTargetsRequired` validation issue raised when the Upgrade type is
      enabled with no target, and verify a unit test covers it being raised and cleared
- [x] 2.2 Feed that issue through the sheet's existing validation message so the disabled
      submit states its reason, and verify a component test asserts the message appears
- [x] 2.3 Add the English validation string and verify no missing-key warning is logged

## 3. Verify

- [x] 3.1 Run the web app's test suite and type-check, and verify both pass
