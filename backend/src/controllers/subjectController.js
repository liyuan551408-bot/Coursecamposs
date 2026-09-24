const subjectService = require('../services/subjectService');

const validateName = (name) => {
    return typeof name === 'string' &&
        name.trim().length >= 2 &&
        name.trim().length <= 100;
};

const listSubjects = async (_req, res, next) => {
    try {
        const subjects = await subjectService.listSubjects();

        return res.json({
            success: true,
            data: subjects
        });
    } catch (error) {
        return next(error);
    }
};

const createSubject = async (req, res, next) => {
    try {
        const code = typeof req.body?.code === 'string'
            ? req.body.code.trim().toUpperCase()
            : '';

        const name = req.body?.name;

        if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message:
                    'Code must contain 2–20 letters, numbers, _ or -'
            });
        }

        if (!validateName(name)) {
            return res.status(400).json({
                success: false,
                message:
                    'Name must contain 2–100 characters'
            });
        }

        const subject = await subjectService.createSubject({
            code,
            name: name.trim()
        });

        return res.status(201).json({
            success: true,
            data: subject
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'This subject code already exists'
            });
        }

        return next(error);
    }
};

const updateSubjectName = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const name = req.body?.name;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject id'
            });
        }

        if (!validateName(name)) {
            return res.status(400).json({
                success: false,
                message:
                    'Name must contain 2–100 characters'
            });
        }

        const subject =
            await subjectService.updateSubjectName(
                id,
                name.trim()
            );

        return res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        return next(error);
    }
};

module.exports = {
    listSubjects,
    createSubject,
    updateSubjectName
};
