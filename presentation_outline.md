# VLM / GeoQuery Demo — Presentation Outline

## Slide 1 — Ask a map. See the answer.
A public, no-login workspace for image-based geospatial question answering. The demo makes the model answer visible through confidence and region-level evidence.

## Slide 2 — The live-demo problem
VLM calls are not instant, raw bounding-box pixels do not survive responsive layouts, and roadmap features can confuse a live audience. The workspace is designed around one reliable upload-to-result path.

## Slide 3 — The two-pipeline story
Pipeline 2 handles a real uploaded image plus a text query. Pipeline 6 contains clearly labeled, hand-prepared Change Detection and SAR Fusion examples. Both render through the same evidence UI.

## Slide 4 — Upload to stable reference
The browser previews the selected image locally. On submit, the server stores the file in secure object storage and passes a stable file reference to the server-side VLM wrapper.

## Slide 5 — Structured answer contract
The VLM returns `{ answer, confidence, regions? }`. Region coordinates use normalized `[x_min, y_min, x_max, y_max]` fractions, so the frontend remains correct regardless of rendered image size.

## Slide 6 — Evidence, not only prose
The result panel combines the answer, confidence badge, source pipeline, region count, and labeled bounding-box overlay. Cyan is reserved for evidence; orange signals execution.

## Slide 7 — Demo sequence
1. Choose an image or drag one into the input zone. 2. Select an example prompt. 3. Run Pipeline 2. 4. While explaining the answer, click Change Detection Example. 5. Click SAR Fusion Example and compare the shared output path.

## Slide 8 — Reliability states
The interface shows a component-level skeleton during processing and a retryable, human-readable error state for timeout or parsing failures. The demo does not depend on login or hidden navigation.

## Slide 9 — What is intentionally small
The first version avoids auth, history, settings, multi-page navigation, and live change-detection computation. This keeps the presentation focused and reduces failure surface.

## Slide 10 — Technical takeaways
Public frontend, typed tRPC procedure, server-side LLM invocation, secure object storage, JSON-backed demo payloads, normalized overlay math, and Vitest coverage for the critical contracts.

## Slide 11 — Roadmap
Add authenticated experiment history, database-backed demo catalog, richer geospatial layers, and asynchronous job status only after the core live flow is proven.

## Slide 12 — Closing
The product thesis: geospatial VLMs become easier to trust when the answer and its spatial evidence are shown together.
