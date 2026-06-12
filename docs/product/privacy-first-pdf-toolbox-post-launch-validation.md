# Privacy PDF Toolbox Post-Launch Validation Plan

This plan defines what to check after the first public GitHub Pages release and how to decide the next product iteration.

## Goal

Validate whether users need a privacy-first PDF toolbox enough to reuse it, recommend it, or ask for paid features.

The MVP should prove three things:

- Users can complete real PDF tasks without help.
- Local-first privacy is a meaningful differentiator.
- The next feature has clear demand before expanding scope.

## Public URL

Expected GitHub Pages URL:

```text
https://lordjun.github.io/app-builder/
```

## First 24-Hour Checks

- [ ] Deployed page loads without asset 404s.
- [ ] Images to PDF works with at least 2 real phone photos.
- [ ] Merge PDFs works with at least 2 real PDFs.
- [ ] Split PDF works with one real PDF and a range such as `1-3,5`.
- [ ] Reorder Pages works with one real PDF and a complete order such as `3,1,2`.
- [ ] Optimize PDF works with one real PDF and reports before/after file size.
- [ ] Split PDF and Reorder Pages show the selected PDF page count before processing.
- [ ] Split PDF and Reorder Pages prefill editable page inputs after reading the selected PDF page count.
- [ ] Split PDF and Reorder Pages show page input errors before processing.
- [ ] Sign PDF works with text signature.
- [ ] Sign PDF works with handwritten signature.
- [ ] Downloads fallback works.
- [ ] Chromium custom folder save works if available.
- [ ] Mobile viewport is usable at 375px width.
- [ ] Feedback link opens a GitHub issue template.

## User Test Script

Use this with 5 to 10 test users.

1. Ask the user to open the app URL.
2. Give them one task only:
   - Convert phone photos into one PDF, or
   - Merge two PDFs, or
   - Split one PDF into a shorter PDF, or
   - Reorder pages in one PDF, or
   - Optimize one PDF and compare output size, or
   - Sign one PDF.
3. Do not explain the UI unless they are blocked.
4. Record:
   - Did they finish the task?
   - How long did it take?
   - Where did they hesitate?
   - Did the output PDF open correctly?
   - Did they trust that files stayed local?
   - What feature did they expect but not find?
   - Would they use this again?
   - Would they pay for batch, compression, OCR, or page reorder?

## Success Signals

Proceed to the next product iteration if most of these are true:

- At least 7 of 10 users complete a real task without help.
- Median task completion time is under 3 minutes.
- At least 5 users mention privacy, no upload, simplicity, or no account as valuable.
- At least 3 users ask for the same next feature.
- At least 2 users say they would pay for a pro feature or use it for work.

## Failure Signals

Pause feature expansion if these appear:

- Users do not understand what the app does from the first screen.
- Users do not trust browser-local processing even after reading the copy.
- Generated PDFs are broken or unacceptable for real documents.
- Mobile file selection blocks common tasks.
- Users prefer existing free tools and cannot name a reason to switch.

## Next Feature Decision Matrix

Rank requested features with this score:

```text
Feature score = frequency of request + task urgency + willingness to pay - implementation risk
```

Initial candidates:

| Feature | Why It Might Matter | Risk |
|---|---|---|
| Optimize PDF | Shipped MVP feature; validates whether before/after size reporting is useful | Browser-only optimization may not reduce every PDF |
| Split PDF | Shipped MVP feature; validate whether page range input is clear enough | May need page preview if users make range mistakes |
| Reorder PDF Pages | Shipped MVP feature; validate whether text-based page ordering is understandable | Better with thumbnails, which adds UI complexity |
| OCR | High perceived value and monetization potential | Larger dependency/API/privacy tradeoff |
| Batch Processing | Strong pro feature for power users | Needs careful memory and error handling |

## Recommended Next Experiment

Split PDF, Reorder Pages, and Optimize PDF are now validation targets. They are easier to validate than OCR, stay local-first, and expand the current PDF workflow without introducing accounts, uploads, or third-party APIs.

Testable MVP:

- User selects one PDF.
- User enters page ranges, such as `1-3,5`.
- App shows the selected PDF page count before processing.
- App exports a new PDF with only those pages.
- Validation catches invalid ranges and page numbers.
- User enters a complete page order, such as `3,1,2`.
- App exports a new PDF with every page exactly once in that order.

## Feedback Handling

For each GitHub feedback issue, label it with one or more of:

- `bug`
- `feature-request`
- `usability`
- `privacy`
- `paid-feature`
- `mobile`

Summarize feedback weekly into:

- Top 3 blockers.
- Top 3 requested features.
- Evidence for or against paid usage.
- Next iteration decision.
