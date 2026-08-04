const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const DEMO_PASSWORD = 'CourseCompass123!';

const users = [
    {
        email: 'student@coursecompass.test',
        name: 'Demo Student',
        role: 'STUDENT',
        major: 'Software Engineering'
    },
    {
        email: 'moderator@coursecompass.test',
        name: 'Demo Moderator',
        role: 'MODERATOR',
        major: null
    },
    {
        email: 'admin@coursecompass.test',
        name: 'Demo Administrator',
        role: 'ADMIN',
        major: null
    }
];

const courses = [
    {
        code: '159.101',
        name: 'Programming Fundamentals',
        description: 'Introduction to programming and problem solving.',
        credits: 15,
        workloadHours: 150
    },
    {
        code: '159.201',
        name: 'Algorithms and Data Structures',
        description: 'Core algorithms, data structures and complexity.',
        credits: 15,
        workloadHours: 160
    },
    {
        code: '159.272',
        name: 'Software Engineering',
        description: 'Software development processes and team practices.',
        credits: 15,
        workloadHours: 150
    },
    {
        code: '159.333',
        name: 'Programming Project',
        description: 'Team-based software development project.',
        credits: 15,
        workloadHours: 180
    },
    {
        code: '158.212',
        name: 'Database Development',
        description: 'Relational modelling, SQL and database applications.',
        credits: 15,
        workloadHours: 160
    },
    {
        code: '158.258',
        name: 'Web Development',
        description: 'Development of modern web applications.',
        credits: 15,
        workloadHours: 150
    },
    {
        code: '161.220',
        name: 'Data Science',
        description: 'Data analysis, preparation and visualisation.',
        credits: 15,
        workloadHours: 160
    },
    {
        code: '157.240',
        name: 'Artificial Intelligence',
        description: 'Foundations of intelligent systems.',
        credits: 15,
        workloadHours: 170
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
                major: user.major
            },
            create: {
                email: user.email,
                passwordHash,
                name: user.name,
                role: user.role,
                major: user.major
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
                isActive: true
            },
            create: {
                ...course,
                isActive: true
            }
        });
    }

    const student = savedUsers.STUDENT;
    const softwareEngineering = savedCourses['159.272'];
    const programmingProject = savedCourses['159.333'];

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
            comment: 'Useful course with practical teamwork.',
            status: 'APPROVED'
        },
        create: {
            userId: student.id,
            courseId: softwareEngineering.id,
            overallRating: 5,
            difficultyRating: 3,
            workloadRating: 4,
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