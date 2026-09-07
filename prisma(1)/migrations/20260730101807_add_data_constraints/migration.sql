/*
  Warnings:

  - A unique constraint covering the columns `[userId,year,semester,name]` on the table `SemesterPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SemesterPlan_userId_year_semester_name_key" ON "SemesterPlan"("userId", "year", "semester", "name");
-- Course values must be valid.
ALTER TABLE "Course"
ADD CONSTRAINT "Course_credits_positive"
CHECK ("credits" > 0);

ALTER TABLE "Course"
ADD CONSTRAINT "Course_workload_hours_non_negative"
CHECK ("workloadHours" IS NULL OR "workloadHours" >= 0);

-- Review ratings must be between 1 and 5.
ALTER TABLE "Review"
ADD CONSTRAINT "Review_overall_rating_range"
CHECK ("overallRating" BETWEEN 1 AND 5);

ALTER TABLE "Review"
ADD CONSTRAINT "Review_difficulty_rating_range"
CHECK ("difficultyRating" BETWEEN 1 AND 5);

ALTER TABLE "Review"
ADD CONSTRAINT "Review_workload_rating_range"
CHECK ("workloadRating" BETWEEN 1 AND 5);

-- Semester plan years must stay within a reasonable range.
ALTER TABLE "SemesterPlan"
ADD CONSTRAINT "SemesterPlan_year_range"
CHECK ("year" BETWEEN 2000 AND 2100);