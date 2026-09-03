const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const DEMO_PASSWORD = 'CourseCompass123!';

const users = [
    {
        email: 'student@coursecompass.test',
        name: 'Demo Student',
        role: 'STUDENT',
        major: 'Software Engineering',
        studyYear: 5,
        interests: ['Game Development', 'Software Engineering'],
        goals: [
            'Build practical software projects',
            'Develop industry-ready skills'
        ],
        planningPreferences: {
            maxCreditsPerSemester: 60,
            preferredAssessmentTypes: ['PROJECT', 'ASSIGNMENT'],
            preferredWorkload: 'MEDIUM',
            avoidExamHeavy: true
        }
    },
    {
        email: 'moderator@coursecompass.test',
        name: 'Demo Moderator',
        role: 'MODERATOR',
        major: null,
        studyYear: null,
        interests: [],
        goals: [],
        planningPreferences: {}
    },
    {
        email: 'admin@coursecompass.test',
        name: 'Demo Administrator',
        role: 'ADMIN',
        major: null,
        studyYear: null,
        interests: [],
        goals: [],
        planningPreferences: {}
    }
];

const courses = [
    {
        code: '159.101',
        name: 'Programming Fundamentals',
        description: 'Introduction to programming and problem solving.',
        credits: 15,
        workloadHours: 150,
        offeredSemesters: ['SEMESTER_1', 'SEMESTER_2'],
        level: 100,
        assessmentTypes: ['ASSIGNMENT', 'QUIZ', 'EXAM'],
        officialLink: null
    },
    {
        code: '159.201',
        name: 'Algorithms and Data Structures',
        description: 'Core algorithms, data structures and complexity.',
        credits: 15,
        workloadHours: 160,
        offeredSemesters: ['SEMESTER_1'],
        level: 200,
        assessmentTypes: ['ASSIGNMENT', 'EXAM'],
        officialLink: null
    },
    {
        code: '159.272',
        name: 'Software Engineering',
        description: 'Software development processes and team practices.',
        credits: 15,
        workloadHours: 150,
        offeredSemesters: ['SEMESTER_1', 'SEMESTER_2'],
        level: 200,
        assessmentTypes: ['ASSIGNMENT', 'PROJECT', 'PRESENTATION'],
        officialLink: null
    },
    {
        code: '159.333',
        name: 'Programming Project',
        description: 'Team-based software development project.',
        credits: 15,
        workloadHours: 180,
        offeredSemesters: ['SEMESTER_2'],
        level: 300,
        assessmentTypes: ['PROJECT', 'PRESENTATION'],
        officialLink: null
    },
    {
        code: '158.212',
        name: 'Database Development',
        description: 'Relational modelling, SQL and database applications.',
        credits: 15,
        workloadHours: 160,
        offeredSemesters: ['SEMESTER_1'],
        level: 200,
        assessmentTypes: ['ASSIGNMENT', 'LAB', 'EXAM'],
        officialLink: null
    },
    {
        code: '158.258',
        name: 'Web Development',
        description: 'Development of modern web applications.',
        credits: 15,
        workloadHours: 150,
        offeredSemesters: ['SEMESTER_2'],
        level: 200,
        assessmentTypes: ['ASSIGNMENT', 'PROJECT'],
        officialLink: null
    },
    {
        code: '161.220',
        name: 'Data Science',
        description: 'Data analysis, preparation and visualisation.',
        credits: 15,
        workloadHours: 160,
        offeredSemesters: ['SEMESTER_1'],
        level: 200,
        assessmentTypes: ['LAB', 'PROJECT', 'QUIZ'],
        officialLink: null
    },
    {
        code: '157.240',
        name: 'Artificial Intelligence',
        description: 'Foundations of intelligent systems.',
        credits: 15,
        workloadHours: 170,
        offeredSemesters: ['SEMESTER_2'],
        level: 200,
        assessmentTypes: ['ASSIGNMENT', 'PROJECT', 'EXAM'],
        officialLink: null
    }
];

const main = async () => {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const savedUsers = {};

    for (const user of users) {
        savedUsers[user.role] = await prisma.user.upsert({
            where: {
                email: user.email
            },
            update: {
                passwordHash,
                name: user.name,
                role: user.role,
                major: user.major,
                studyYear: user.studyYear,
                interests: user.interests,
                goals: user.goals,
                planningPreferences: user.planningPreferences
            },
            create: {
                email: user.email,
                passwordHash,
                name: user.name,
                role: user.role,
                major: user.major,
                studyYear: user.studyYear,
                interests: user.interests,
                goals: user.goals,
                planningPreferences: user.planningPreferences
            }
        });
    }

    const savedCourses = {};

    for (const course of courses) {
        savedCourses[course.code] = await prisma.course.upsert({
            where: {
                code: course.code
            },
            update: {
                name: course.name,
                description: course.description,
                credits: course.credits,
                workloadHours: course.workloadHours,
                offeredSemesters: course.offeredSemesters,
                level: course.level,
                assessmentTypes: course.assessmentTypes,
                officialLink: course.officialLink,
                isActive: true
            },
            create: {
                ...course,
                isActive: true
            }
        });
    }
    await prisma.course.update({
        where: {
            code: '159.201'
        },
        data: {
            prerequisites: {
                connect: {
                    id: savedCourses['159.101'].id
                }
            }
        }
    });

    await prisma.course.update({
        where: {
            code: '159.333'
        },
        data: {
            prerequisites: {
                connect: [
                    {
                        id: savedCourses['159.201'].id
                    },
                    {
                        id: savedCourses['159.272'].id
                    }
                ]
            }
        }
    });

    const student = savedUsers.STUDENT;
    const programmingFundamentals = savedCourses['159.101'];
    const softwareEngineering = savedCourses['159.272'];
    const programmingProject = savedCourses['159.333'];

    await prisma.completedCourse.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: programmingFundamentals.id
            }
        },
        update: {
            completedAt: new Date('2025-11-15T00:00:00.000Z')
        },
        create: {
            userId: student.id,
            courseId: programmingFundamentals.id,
            completedAt: new Date('2025-11-15T00:00:00.000Z')
        }
    });

    await prisma.review.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: softwareEngineering.id
            }
        },
        update: {
            overallRating: 5,
            difficultyRating: 3,
            workloadRating: 4,
            teachingRating: 4,
            assessmentStyle: 'PRACTICAL',
            usefulnessRating: 5,
            comment: 'Useful course with practical teamwork.',
            status: 'APPROVED'
        },
        create: {
            userId: student.id,
            courseId: softwareEngineering.id,
            overallRating: 5,
            difficultyRating: 3,
            workloadRating: 4,
            teachingRating: 4,
            assessmentStyle: 'PRACTICAL',
            usefulnessRating: 5,
            comment: 'Useful course with practical teamwork.',
            status: 'APPROVED'
        }
    });

    await prisma.savedCourse.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: programmingProject.id
            }
        },
        update: {},
        create: {
            userId: student.id,
            courseId: programmingProject.id
        }
    });

    const semesterPlan = await prisma.semesterPlan.upsert({
        where: {
            userId_year_semester_name: {
                userId: student.id,
                year: 2026,
                semester: 'Semester 2',
                name: 'Demo 2026 Plan'
            }
        },
        update: {},
        create: {
            userId: student.id,
            name: 'Demo 2026 Plan',
            year: 2026,
            semester: 'Semester 2'
        }
    });

    await prisma.planCourse.upsert({
        where: {
            planId_courseId: {
                planId: semesterPlan.id,
                courseId: programmingProject.id
            }
        },
        update: {},
        create: {
            planId: semesterPlan.id,
            courseId: programmingProject.id
        }
    });

    console.log('Seed completed successfully.');
    console.log(`Users: ${users.length}`);
    console.log(`Courses: ${courses.length}`);
    console.log(`Demo password: ${DEMO_PASSWORD}`);
};

main()
    .catch((error) => {
        console.error('Seed failed.');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
