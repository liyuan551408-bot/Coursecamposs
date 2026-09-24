const prisma = require('../lib/prisma');

const listSubjects = () => {
    return prisma.subject.findMany({
        select: {
            id: true,
            code: true,
            name: true,
            _count: {
                select: {
                    courses: true
                }
            }
        },
        orderBy: {
            code: 'asc'
        }
    });
};

const createSubject = ({ code, name }) => {
    return prisma.subject.create({
        data: { code, name },
        select: {
            id: true,
            code: true,
            name: true
        }
    });
};

const updateSubjectName = (id, name) => {
    return prisma.subject.update({
        where: { id },
        data: { name },
        select: {
            id: true,
            code: true,
            name: true
        }
    });
};

module.exports = {
    listSubjects,
    createSubject,
    updateSubjectName
};
