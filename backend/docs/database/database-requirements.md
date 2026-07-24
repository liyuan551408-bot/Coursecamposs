# CourseCompass Database Requirements

## 1. User Management

The system stores:
- user email
- password hash
- display name
- role
- major
- account creation time

Roles:
- STUDENT
- MODERATOR
- ADMIN

## 2. Course Information

The system stores:
- course code
- course title
- description
- credits
- level
- estimated workload
- active status

## 3. Reviews

A student can review a course.

A review stores:
- overall rating
- difficulty rating
- workload rating
- comment
- moderation status
- creation time

## 4. Course Planning

A user can:
- save courses
- create semester plans
- add courses to a semester plan
- record completed courses

## 5. Course Relationships

The system stores:
- course prerequisites
- course offerings
- course assessments
- course tags

## 6. Moderation

Users can report reviews.

Moderators and administrators can:
- approve reviews
- reject reviews
- hide reviews
- process reports

## 7. AI Recommendation Data

The recommendation module may use:
- user major
- completed courses
- interest tags
- course descriptions