## 1. Events

- [x] 1.1 Declare `navigation_search_opened`, `navigation_search_item_selected` and `navigation_search_dismissed`, sent with only the declared properties
- [x] 1.2 Report the opening source from the shortcut, the top bar and the phone Menu
- [x] 1.3 Report each pick (list rows and phone chips) with its kind, target, group, position, query length and keyboard or pointer
- [x] 1.4 Report a close without a pick with the query length and rows listed; the field's text lives in the palette so each opening starts empty

## 2. Tests

- [x] 2.1 Provider maps the three events to their declared properties
- [x] 2.2 Desktop: opening, keyboard pick, pointer pick and dismissal; no query text sent
- [x] 2.3 Phone: Menu opening, chip pick and dismissal
- [x] 2.4 Pick helpers: recent page vs page, Find in Collection without a target, chip positions
