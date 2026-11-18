# Every image shows as a thumbnail and its mark as a pill, in the composer and in a sent message

> **Accepted.** It amends ADR 0200, which put a marked image in the words and left the strip and the sent message's top row to the images no mark names. The strip is `AttachmentChip` in `src/ui/previews.tsx`, wired in `src/ui/ChatPane.tsx`. The pill over a mark is `src/ui/inlineMarks.tsx`. The mark helpers are `withoutMarks` and `placeImages` in `src/hermes/inlineImages.ts`. A sent message's pill is `InlineSentImage` in `src/ui/previews.tsx`. Tested in `src/hermes/inlineImages.test.ts`, `src/ui/inlineMarks.test.tsx`, `src/ui/previews.test.tsx`, `src/ui/screenshot.test.tsx`, `src/ui/paste.test.tsx` and `e2e/features/send-image.e2e.tsx`.

The owner pastes a screenshot and wants to see it. Under ADR 0200 a marked image left the strip above the composer, so the only sign of it was a small chip over a mark in the words. The strip's own chips were 28 px. When a mark wrapped onto a second line, no chip covered it and the raw `[image 2: clipboard-….png]` text showed. A sent message hid a marked image above the words and showed it only as a picture in the middle of a line.

The owner's reference is a row of square thumbnails at the top of the composer, each with a small remove button over its corner, and a pill in the text with a tiny image, the name and the size.

## Decisions

- **The strip shows every staged attachment, marked or not.** An image is an 88 px square thumbnail with `object-fit: cover`, a thin border and a Remove button over its top-right corner. The name and size are in its tooltip, and the name is also in the page for screen readers and tests. While its preview is being read the card shows blank. A file that isn't an image, or an image whose preview failed or can't be drawn, keeps the small chip with a paperclip and says why in its tooltip. An annotation that went stale shows "page changed" on its card (ADR 0094).
- **Removing an image removes its marks.** Remove on a marked image takes out every mark that names it, and one space beside each, in one edit. Undo brings the words back, and the image does not return. Backspace and Delete over a mark still take out only the mark and keep the image (ADR 0200), since the image is in the strip now and nothing is hidden.
- **A mark that wraps still gets its pill.** The chip goes on the widest line of the mark. The other lines are covered with a plain box in the composer's colour, so the raw words never show. The words still show while the cursor or a selection is in the mark, as before.
- **A sent message shows every image above its words.** The top row is the message's images in the order they were attached, as it was before ADR 0200, with the same sizes. This replaces "a sent message shows each image once" and "an image no mark names goes above the words" for display. ADR 0200's decision about where an image goes in the words stands.
- **A mark in a sent message's words is a pill.** It has a tiny thumbnail once the image is read, else an image icon, and the name the mark gives. Hermes keeps no size, so none is shown. The pill opens the image in the Preview, as the picture above does. A pill never reads an image this app didn't send: that still waits for Show image on the picture above the words (ADR 0200).

## Considered options

- **Keep marked images out of the strip.** It leaves the owner no large view of a pasted screenshot, which is what they asked for.
- **Draw the wrapped mark's pill on its first line only.** The mark's other lines would still show raw words.
- **Keep the marked image's mark when its Remove is used.** The words would name an image that is gone, and `sentText` would drop the mark on send anyway.

## Consequences

- An image appears twice while the owner writes: as a thumbnail in the strip and as a pill in the words. Likewise in a sent message: once above the words, once as a pill.
- A message sent before ADR 0200 has no marks and looks as it did.
- A pill cannot show a size in a sent message. The composer's can, since the file is staged.
