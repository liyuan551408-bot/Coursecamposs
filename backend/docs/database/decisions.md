# Database Decisions

## 1. Course field naming

The Course model uses `name` instead of `title` in the initial version
because the existing Express API returns course objects with a `name` field.

## 2. Review uniqueness

A user can submit only one review for each course in the initial version.

## 3. Saved courses

A user cannot save the same course more than once.

## 4. Course deletion

Courses are deactivated using `isActive` instead of being permanently deleted.

## 5. Review moderation

New reviews have the default status `PENDING`.