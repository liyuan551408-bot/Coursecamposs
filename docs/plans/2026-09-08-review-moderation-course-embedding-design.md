# Review Moderation and Course Embedding Design

## Goal

Give moderators a usable queue for publishing or rejecting student reviews, and generate each newly created course's vector after the create request has completed.

## Architecture

The existing review state machine remains authoritative: student submissions are `PENDING`, only `APPROVED` reviews are public, and the existing moderator/admin endpoints change status. A new Vue moderation page will consume the pending-review endpoint, show the evidence needed for a decision, and remove a review from the queue after approval or rejection. Both `MODERATOR` and `ADMIN` roles can open the page; course creation remains admin-only.

Course vectors continue to use the canonical text builder and `refreshCourseEmbedding`, which persists a 1024-dimensional vector to `Course.embedding`. Course creation will enqueue an in-process `setImmediate` job instead of awaiting the provider request. The API can therefore return the newly stored course immediately. Provider/database failures are logged and leave `embedding` null, allowing the existing `npm run embeddings:generate` command to repair missing vectors later.

## Error Handling and Verification

The moderation page distinguishes loading, empty, and error states and disables both actions while a review is being updated. Backend role middleware remains the security boundary even if frontend route metadata is bypassed. The background job catches rejected promises so it cannot crash the API process. Verification consists of backend syntax checks, a focused background-job test with an injected scheduler/worker, and a production frontend build.
