-- Recover the range constraints omitted by a previously failed migration. The
-- conditional form also keeps fresh databases, where that migration succeeds,
-- deployable.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_study_year_range') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_study_year_range"
      CHECK ("studyYear" IS NULL OR "studyYear" BETWEEN 1 AND 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Course_level_valid') THEN
    ALTER TABLE "Course" ADD CONSTRAINT "Course_level_valid"
      CHECK ("level" IS NULL OR ("level" BETWEEN 100 AND 900 AND "level" % 100 = 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_teaching_rating_range') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_teaching_rating_range"
      CHECK ("teachingRating" IS NULL OR "teachingRating" BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Review_usefulness_rating_range') THEN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_usefulness_rating_range"
      CHECK ("usefulnessRating" IS NULL OR "usefulnessRating" BETWEEN 1 AND 5);
  END IF;
END $$;

-- BAAI/bge-m3 returns 1024-dimensional embeddings. Existing vectors come from
-- a different model and cannot be compared or cast to the new vector space.
ALTER TABLE "Course"
  ALTER COLUMN "embedding" TYPE vector(1024)
  USING NULL::vector(1024);
