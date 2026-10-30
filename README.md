# TYPEGLITCH

A lightweight, purple-themed typing automation and analytics panel for the owner's own Monkeytype-style typing project.

## Features

- Basic WPM pacing and advanced randomized delays
- Adjustable word pause and accuracy simulation
- Live WPM estimate, attempt count, accuracy estimate, elapsed time, and progress bar
- Draggable panel
- Start, stop, reset, and ArrowRight toggle
- Settings saved in localStorage
- No external libraries or network requests

## Install / run

1. Open your own typing-test project.
2. Open the browser developer console.
3. Paste the contents of [typeglitch.js](./typeglitch.js).
4. Press Enter. Use the panel's START button or ArrowRight to toggle.

The project DOM adapter currently expects:
- `#words` containing `.word` elements
- the current word marked `.word.active`
- character elements as direct children of each word, with untyped characters having an empty class name
- a `textarea#wordsInput` input target

## Important technical notes

The script updates the textarea through its native value setter and dispatches a bubbling `input` event. These are synthetic events, not physical keystrokes. Your project's input handler must accept ordinary input events for the automation to work.

WPM and accuracy shown in the panel are estimates calculated from the script's own attempts. They are not a substitute for the typing game's own results.

## Reference

The companion `monkeytypehack` repository was reviewed for ideas around separating configuration/typing logic, WPM-based timing, and a compact control panel. TYPEGLITCH uses its own integrated implementation and does not load its remote CSS or depend on its Python/Selenium setup.
