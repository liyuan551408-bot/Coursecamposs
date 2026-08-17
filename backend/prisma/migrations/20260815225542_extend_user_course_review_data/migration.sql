-- CreateEnum
CREATE TYPE "CourseSemester" AS ENUM ('SEMESTER_1', 'SEMESTER_2', 'SUMMER');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('EXAM', 'ASSIGNMENT', 'QUIZ', 'PROJECT', 'LAB', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "AssessmentStyle" AS ENUM ('EXAM_HEAVY', 'COURSEWORK_HEAVY', 'PROJECT_BASED', 'PRACTICAL', 'BALANCED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "assessmentTypes" "AssessmentType"[] DEFAULT ARRAY[]::"AssessmentType"[],
ADD COLUMN     "level" INTEGER,
ADD COLUMN     "offeredSemesters" "CourseSemester"[] DEFAULT ARRAY[]::"CourseSemester"[],
ADD COLUMN     "officialLink" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "assessmentStyle" "AssessmentStyle",
ADD COLUMN     "teachingRating" INTEGER,
ADD COLUMN     "usefulnessRating" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "planningPreferences" JSONB,
ADD COLUMN     "studyYear" INTEGER;

-- CreateTable
CREATE TABLE "CompletedCourse" (
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CompletedCourse_pkey" PRIMARY KEY ("userId","courseId")
);

-- CreateIndex
CREATE INDEX "CompletedCourse_courseId_idx" ON "CompletedCourse"("courseId");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");

-- AddForeignKey
ALTER TABLE "CompletedCourse" ADD CONSTRAINT "CompletedCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedCourse" ADD CONSTRAINT "CompletedCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User"   ADD CONSTRAINT "User_study_year_range" CHECK("studyYear" IS NULL OR "studyYear" BETWEEN 1 AND 8);

ALTER TABLE "Course" ADD CONSTRAINT "Course_level_valid" CHECK("level" IS NULL OR("level" BETWEEN 100 AND 900 AND "level" % 100 = 0));

ALTER TABLE "Review" ADD CONSTRAINT "Review_teaching_rating_range" CHECK("teachingRating" IS NULL OR "teachingRating" BETWEEN 1 AND 5);

ALTER TABLE "Review" ADD CONSTRAINT "Review_usefulness_rating_range" CHECK("usefulnessRating" IS NULL OR "usefulnessRating" BETWEEN 1 AND 5);
