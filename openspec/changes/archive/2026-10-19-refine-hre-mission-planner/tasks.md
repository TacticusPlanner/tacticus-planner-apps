## 1. Tracker

- [x] 1.1 Add a "Mark done" button per objective that sets the progress to the target
- [x] 1.2 Show a progress input at 0 as empty, with a "0" placeholder, and select its text on focus

## 2. Campaign raids

- [x] 2.1 Split the nodes that drop nothing into `noDropRows`, filled on their own
- [x] 2.2 Order within a cost: goal drops first by drop rate, then gold, then priority; other nodes by gold
- [x] 2.3 Ignore the campaign-type Raids Filter for mission raids
- [x] 2.4 Show "owned/target" on goal-drop rows, sharing `ResourceStock` with the HSE tab
- [x] 2.5 Replace the cheapest-node summary with `campaignOutlook` over the event's days left

## 3. Verification

- [x] 3.1 Unit tests for the planner, the outlook and the hook, plus page tests for one-click completion, the leading zero, the no-drop section and the outlook
- [x] 3.2 Typecheck, lint, FSD lint, Prettier and the full web test run
