# Tests

End-to-end tests that drive the real UI in headless Chromium. The game itself stays
dependency-free — these are optional and are not needed to play or ship it.

## Running

They need [Playwright](https://playwright.dev). If it is installed globally, link it in:

```sh
mkdir -p tests/node_modules
ln -sfn "$(npm root -g)/playwright" tests/node_modules/playwright
ln -sfn "$(npm root -g)/playwright-core" tests/node_modules/playwright-core
```

Then:

```sh
node tests/house-ui.mjs        # ~15s  — creation, the three House tabs, save shape
node tests/house-rollover.mjs  # ~10s  — a finished season is filed into career history
node tests/house-match.mjs     # ~90s  — plays a career match, checks the report and payout
node tests/house-season.mjs    # ~7min — plays five matches, checks accumulation
```

Each exits non-zero on failure and prints a PASS/FAIL line per assertion.

## Note on timing

The simulation clamps `dt` at 33ms, so a match cannot be fast-forwarded by inflating
frame timestamps — it has to be stepped. The harness pumps `requestAnimationFrame` off a
timer instead of the vsync clock, which plays a 6-minute match out in about a minute.
