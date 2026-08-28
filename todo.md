# Project TODO

- [x] Public no-login demo workspace with cinematic deep-teal and burnt-orange visual system
- [x] Image file picker with local preview before submission
- [x] Drag-and-drop image upload interaction
- [x] Query input with submit control and 3 clickable example prompts
- [x] Secure object-storage upload with stable backend file reference
- [x] Pipeline 2 VLM wrapper procedure returning typed answer, confidence, and optional regions
- [x] Pipeline 6 Change Detection Example control with hand-prepared JSON
- [x] Pipeline 6 SAR Fusion Example control with hand-prepared JSON
- [x] Shared result rendering path for real and demo responses
- [x] Confidence badge and normalized bounding-box region labels
- [x] Responsive overlay rendering scaled to displayed image dimensions
- [x] Component-level processing spinner/skeleton state
- [x] Friendly retryable timeout/failure state
- [x] Vitest coverage for response validation, normalized overlay geometry, and demo payloads
- [x] Browser and responsive visual verification
- [x] Presentation walkthrough and implementation notes
- [x] Move Pipeline 6 Change Detection Example payload into a hand-prepared JSON file or demo endpoint
- [x] Move Pipeline 6 SAR Fusion Example payload into a hand-prepared JSON file or demo endpoint
- [x] Add and execute tests for Pipeline 2 structured response parsing and both Pipeline 6 payload schemas
- [x] Add reusable AnimatedList component with selectable items and callback support
- [x] Add optional gradients, arrow-key navigation, and scrollbar behavior to AnimatedList
- [x] Integrate AnimatedList into the VLM GeoQuery workspace without disrupting the upload/results flow
- [x] Add tests and visual verification for AnimatedList interaction
- [x] Add component-level tests for AnimatedList selection callbacks and arrow-key navigation
- [x] Add an integration test verifying AnimatedList selection updates the Home query field
- [x] Re-run pnpm test and confirm component interaction coverage is discovered and passing
- [x] Install OGL and add a reusable MoltenMetal visual component
- [x] Integrate MoltenMetal with the requested purple, pink, and white configuration
- [x] Preserve workspace readability and interaction performance over the animated background
- [x] Test MoltenMetal rendering, cleanup, and existing demo regressions
- [x] Add a MoltenMetal-focused mount, fallback, and cleanup test
- [x] Add an integration regression test covering a key Home interaction with MoltenMetal present
- [x] Capture and review post-MoltenMetal desktop and mobile screenshots for readable, non-blocking UI
- [x] Reduce MoltenMetal opacity to 0.8 and add a slight blur without harming foreground readability
- [x] Add hover confidence tooltips to normalized result bounding boxes
- [x] Add image skeleton overlay and cycling processing messages during VLM submission
- [x] Test the refined hover, loading, responsive, and existing demo interactions
- [x] Trigger both Pipeline 6 demo buttons after the refinements and verify shared result rendering
- [x] Re-run pnpm test after adding Pipeline 6 demo-button regression coverage
- [x] Add a visually distinct results legend explaining region labels and confidence scores
- [x] Enhance image drag-and-drop with active drop feedback and reliable file handling
- [x] Add a Clear Results control that resets image, query, preview, and result state
- [x] Test legend visibility, drag-and-drop behavior, clear/reset behavior, and responsive regressions


## Independent Copy Enhancements

- [x] Add an ISRO-inspired landing page with original space-themed visual treatment and descriptive mission narrative.
- [x] Add a clear entry choice between Text Query and Vision Query before entering the analysis workspace.
- [x] Ensure the user-facing interface contains no pipeline terminology.
- [x] Gate Suggested Analysis visibility until an image upload or text-query action has occurred.
- [x] Gate result visibility until the corresponding image upload or query action has occurred.
- [x] Preserve the existing geospatial overlays, VLM/demo behavior, clear/reset flow, and responsive workspace.
- [x] Add or update Vitest coverage for the landing-to-workspace and action-gated visibility flows.
- [x] Visually verify the enhanced landing page and workspace on desktop and mobile viewports.
- [x] Save a checkpoint after the requested enhancements are complete.

> These items belong to this independent copy and are not a continuation of source-project work.THOOK-niň даҽаassistant to=functions.file 乱子伦  (to=functions.file, commentary 代杀码) ]().json[{


## Follow-up Gaps Identified During Verification

- [x] Implement a genuinely distinct runnable Text Query mode rather than only changing labels.
- [x] Align Suggested Analysis gating with the final text-mode and vision-mode action triggers.
- [x] Add tests covering the distinct Text Query behavior and its result reveal.
- [x] Capture desktop and mobile screenshots for the entered workspace, not only the landing page.
- [x] Re-read and correct completion status before the final checkpoint.

> The earlier enhancement items remain as historical tracking entries; these follow-up items capture verification gaps found afterward.



## Workspace Toggle, Gallery, and Export Enhancements

- [x] Add an in-workspace Text Query / Vision Query toggle that switches modes without returning to the landing page.
- [x] Add a curated gallery of sample Earth-observation images for quick Vision Query testing.
- [x] Add PDF export for completed analysis results.
- [x] Add shareable links for completed analysis results with safe persistence and retrieval.
- [x] Add Vitest coverage for mode switching, gallery selection, PDF export, and share-link flows.
- [x] Visually verify the new controls and flows on desktop and mobile.
- [x] Review TODO completion and save a checkpoint before delivery.

> These items belong to the independent copy and extend the existing GeoQuery enhancement work.


## Verification Gaps to Resolve

- [x] Make gallery selections populate a runnable Vision Query input path instead of only loading a prepared result shortcut.
- [x] Add tests for PDF export invocation and share-link creation/retrieval, including the shared-analysis route.
- [x] Visually verify completed result-state export/share controls on desktop and mobile.
- [x] Save a new checkpoint after resolving these gaps and rechecking the full TODO.


## Final Verification Corrections

- [x] Convert curated gallery samples to supported raster image types and verify a selected sample submits through the real Vision Query mutation.
- [x] Add tests for share.get and the SharedAnalysis page/route, including success and not-found states.
- [x] Capture desktop and mobile screenshots with a completed result showing PDF and share-link controls.
- [x] Save a fresh checkpoint only after the corrections and final TODO review.


## Last Verification Gaps

- [x] Submit a gallery-selected sample through the real Vision Query mutation in a test and assert the resulting analysis.
- [x] Add route-level coverage for `/share/:token` in App.tsx, including valid and missing tokens.
- [x] Save a fresh checkpoint after this final verification pass.


## Copy Polish

- [x] Reduce dash-heavy punctuation in visible landing, workspace, gallery, and export/share copy so the interface reads more naturally.
- [x] Run text regression checks and visually verify the revised copy.
- [x] Save a fresh checkpoint for the copy update.


## Interactive Landing Motion

- [x] Add purposeful animated motion to the landing page so it feels interactive without reducing readability.
- [x] Add pointer-responsive or parallax behavior that remains lightweight and does not interfere with entry actions.
- [x] Add a prefers-reduced-motion fallback for the landing experience.
- [x] Review the referenced design guidance and decide whether external motion packages are necessary.
- [x] Add or update tests for the animated landing interactions and existing entry actions.
- [x] Visually verify the animated landing page on desktop and mobile.
- [x] Save a fresh checkpoint after the motion update.


## Motion Verification Gaps

- [x] Add focused tests for landing pointer parallax state changes and reduced-motion fallback.
- [x] Save a fresh checkpoint after the animated landing update is fully verified.


## Copy Review Gaps

- [x] Visually verify the revised workspace and shared-analysis copy after the punctuation edits.
- [x] Save a fresh checkpoint after the copy-polish verification.


## Workflow Explainer and Reusable Skill

- [x] Add an animated Ask, Detect, Explain sequence to the landing page.
- [x] Add touch-friendly landing motion for mobile devices without requiring a mouse pointer.
- [x] Replace the temporary orbital mark with a distinctive GeoQuery evidence and query symbol.
- [x] Add focused tests for the workflow sequence, touch behavior, and branding mark.
- [x] Visually verify the updated landing page on desktop and mobile.
- [x] Create a reusable skill that captures the design, implementation, testing, and checkpoint workflow used for this project.
- [x] Validate and deliver the reusable skill alongside the website checkpoint.


## Final Delivery Gaps

- [x] Add a focused regression test that asserts the GeoQuery evidence and query mark renders in the landing header.
- [x] Save a fresh website checkpoint after the workflow, touch motion, and branding updates.
- [x] Deliver the reusable skill file with the final checkpoint.
