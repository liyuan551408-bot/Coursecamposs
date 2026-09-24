INSERT INTO "Subject" ("code", "name", "updatedAt")
VALUES
    ('157', 'Information Systems', CURRENT_TIMESTAMP),
    ('158', 'Information Technology', CURRENT_TIMESTAMP),
    ('159', 'Computer Science', CURRENT_TIMESTAMP),
    ('161', 'Statistics', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Course" AS course
SET "subjectId" = subject."id"
FROM "Subject" AS subject
WHERE course."subjectId" IS NULL
  AND split_part(course."code", '.', 1) = subject."code";
