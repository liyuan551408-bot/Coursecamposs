/** @file Implements user business rules and persistence operations. */
const bcrypt = require('bcryptjs'); // Import bcrypt.
const crypto = require('crypto');
const prisma = require('../lib/prisma'); //[cite: 2]
const { validatePassword } = require('../utils/passwordPolicy');

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    major: true,
    createdAt: true,
    updatedAt: true,
    studyYear:true,
    interests:true,
    goals:true,
    planningPreferences:true,

    completedCourses: {
    select: {
        completedAt: true,
        course: {
            select: {
               id:true,
               code:true,
               name:true,
               credits:true
            }
        }
    }
}


}; //[cite: 2]

const normalizeEmail = (email) => {
    if (typeof email !== 'string' || email.trim() === '') {
        throw new TypeError('A valid email is required');
    }
    return email.trim().toLowerCase();
}; //[cite: 2]

const findUserForAuthenticationByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email: normalizeEmail(email) },
        select: {
            id: true,
            email: true,
            passwordHash: true,
            name: true,
            role: true,
            major: true,
            studyYear: true,
            interests: true,
            goals: true,
            planningPreferences: true
        }
    });
}; //[cite: 2]

const findPublicUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id:Number(id) },
        select: publicUserSelect
    });
}; //[cite: 2]

// Standardization: receive plaintext password and hash it here.
const createUser = async ({ email, password, name, major = null, studyYear = null }) => {
    validatePassword(password);
    if (typeof name !== 'string' || name.trim() === '') {
        throw new TypeError('A user name is required');
    }

    const normalizedStudyYear = studyYear === null || studyYear === '' || studyYear === undefined
        ? null
        : Number(studyYear);
    if (normalizedStudyYear !== null && (!Number.isInteger(normalizedStudyYear) || normalizedStudyYear < 1 || normalizedStudyYear > 8)) {
        throw new TypeError('Study year must be a whole number between 1 and 8');
    }

    // Hash in the service layer to keep business logic cohesive.
    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.create({
        data: {
            email: normalizeEmail(email),
            passwordHash, // Store the hashed password.
            name: name.trim(),
            major: typeof major === 'string' && major.trim() !== '' ? major.trim() : null,
            studyYear: normalizedStudyYear
        },
        select: publicUserSelect
    });
};

// Reset password: generate and store a verification code.
const generateResetCode = async (email) => {
    // 1. find user
    const user = await prisma.user.findUnique({where:{ email: normalizeEmail(email)}});

    if(!user) return null;

    // 2. generate 6-digit random code (like 295638)
    const resetCode = crypto.randomInt(100000,1000000).toString();

    // Give email delivery and form completion enough time while keeping the code short-lived.
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    // 4. update reset code and expiration time to database
    const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
    await prisma.user.update({
        where: {id: user.id},
        data:{
            resetCode: resetCodeHash,
            resetCodeExpires
        }
    });

    return resetCode;
}

// Verify the code and reset the password.
const resetPassword = async (email, resetCode, newPassword) => {
    validatePassword(newPassword);
    if (typeof resetCode !== 'string' || !/^\d{6}$/.test(resetCode)) {
        throw new Error('Invalid code');
    }
    const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
    // 1. Match both email and verification code in the database.
    const user = await prisma.user.findFirst({
        where: { 
            email: normalizeEmail(email),
            resetCode: resetCodeHash
        }
    });

    // If no user is found, the email or verification code is wrong.
    if (!user) {
        throw new Error('Invalid code');
    }

    // 2. Check whether the verification code has expired.
    if (new Date() > user.resetCodeExpires) {
        throw new Error('Code expired');
    }

    // 3. Validation passed. Hash the new password with the same rule used by createUser.
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 4. Update the database with the new password and clear code fields to prevent reuse.
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: passwordHash,
            resetCode: null,
            resetCodeExpires: null
        }
    });

    return true;
};

// Update a user's profile.
const updateUserProfile = async (id, data) => {
    // Ignore undefined values so existing fields are not overwritten accidentally.
    const updateData = {};
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || !data.name.trim()) throw new TypeError('Name is required');
        updateData.name = data.name.trim();
    }
    if (data.major !== undefined) {
        updateData.major = typeof data.major === 'string' && data.major.trim() ? data.major.trim() : null;
    }
    if (data.studyYear !== undefined) {
        const value = data.studyYear === null || data.studyYear === '' ? null : Number(data.studyYear);
        if (value !== null && (!Number.isInteger(value) || value < 1 || value > 8)) {
            throw new TypeError('Study year must be a whole number between 1 and 8');
        }
        updateData.studyYear = value;
    }
    for (const field of ['interests', 'goals']) {
        if (data[field] !== undefined) {
            if (!Array.isArray(data[field]) || data[field].some((value) => typeof value !== 'string')) {
                throw new TypeError(`${field} must be an array of text values`);
            }
            updateData[field] = data[field].map((value) => value.trim()).filter(Boolean);
        }
    }
    if (data.planningPreferences !== undefined) {
        if (data.planningPreferences !== null && (typeof data.planningPreferences !== 'object' || Array.isArray(data.planningPreferences))) {
            throw new TypeError('planningPreferences must be an object');
        }
        updateData.planningPreferences = data.planningPreferences;
    }
    return prisma.user.update({
        where: { id:Number(id) },
        data: updateData,
        select: publicUserSelect // Reuse the safe response shape without password fields.
    });
};

module.exports = {
    normalizeEmail,
    findUserForAuthenticationByEmail,
    findPublicUserById,
    createUser,
    generateResetCode,
    resetPassword,
    updateUserProfile
};
