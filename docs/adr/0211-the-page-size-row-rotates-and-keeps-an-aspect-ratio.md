# The page size row rotates and keeps an aspect ratio

> **Accepted.** `ViewportBar` in `src/ui/PageViewport.tsx`, styled under `.preview-viewport` in `src/styles.css`. Tested in `src/ui/previewPane.test.tsx`.

The owner found the row from ADR 0198 cramped. The native select drew its own light arrow and cut its text, and the number boxes were small. They asked for the row to look like a device toolbar's: the device as plain text with a chevron, two rounded number boxes with a × between them, then a link button and a rotate button.

## Decisions

- **The select reads as text, not as a field.** It has no border or fill until the pointer is over it, and draws a lucide chevron in place of the native arrow. It is as wide as the device picked (`field-sizing: content`), at least 160 pixels, so a device's name and size show whole.
- **The number boxes are filled, rounded and in the mono font.** While the page fills the box, its size shows in full text color, as the target toolbar shows it. The select already says Responsive.
- **Rotate swaps the width and the height.** From Responsive it gives the page the box turned on its side. A device stays picked when rotated, so rotating it twice gives the device back. The button is off when a turned side would fall outside 50 to 9999.
- **Keep the aspect ratio is a toggle.** While it is on, a side typed sets the other to keep the shape the row shows, rounded to a whole pixel and held within 50 to 9999. It starts off and is not saved, as the size isn't.
- **A narrow panel keeps the numbers whole.** Below 440 pixels the boxes hold four digits and the select takes what is left, down to its chevron.

## Considered options

- **Draw the link and rotate icons without behavior.** Rejected: a button that does nothing is worse than no button.
- **Drop the size from each device's option, so the select stays short.** Rejected: the menu lists each device's size, as ADR 0198 has it.

## Consequences

- **The boxes move right when a longer device name is picked**, because the select is as wide as its text.
- **A rotated device's option still reads its upright size**, such as iPhone SE (375 × 667) beside 667 × 375.
