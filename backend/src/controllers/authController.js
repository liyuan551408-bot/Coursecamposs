// 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const emailService = require('../services/emailService');
// Handle user registration.
const register = async (req, res) => {
    try {
        // 1. Extract data from the request body sent by the frontend.
        const { email, password, name, major } = req.body;

        // 2. Basic validation for required fields.
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // 3. Hash the plaintext password with salt rounds set to 10.
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Call the lower-level createUser method to store the user in the database.
        const newUser = await userService.createUser({
            email,
            password,
            name,
            major
        });

        // 5. Return JSON data to the frontend after success.
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: newUser
        });

    } catch (error) {
        console.error('Registration Error:', error);
        
        // Handle duplicate email errors (Prisma error code P2002).
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Other unknown server errors.
        res.status(500).json({
            success: false,
            message: 'Server Error during registration'
        });
    }
};

// Handle user login.
const login = async (req, res) => {
    try {
        // 1. Extract email and password from the request body.
        const { email, password } = req.body;

        // 2. Basic validation.
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // 3. Get user data with password hash from findUserForAuthenticationByEmail.
        const user = await userService.findUserForAuthenticationByEmail(email);

        // For security, return the same invalid credentials message if the user does not exist.
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 4. Compare the plaintext password from the frontend with the stored password hash.
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 5. JWT logc
        // Include basic identity information.
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // 2. Issue token.
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // Use the secret defined in .env.
            { expiresIn: '24h' }    // Expire after 24 hours.
        );

        // 6. Password is correct. Remove passwordHash before returning data.
        const { passwordHash, ...safeUser } = user;

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token: token,
            data: safeUser
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error during login'
        });
    }
};

const forgotPassword = async(req, res) => {
    try{
        const { email } = req.body;

        if(!email){
            return res.status(400).json({
                success : false,
                message : 'Email is required'
            });
        }

        const resetCode = await userService.generateResetCode(email);

        // If the user exists and a code was generated, send the reset email.
        if (resetCode) {
            try {
                // Send the real email.
                await emailService.sendResetEmail(email, resetCode);
                console.log(`[Email Success] Reset email sent successfully to ${email}`);
            } catch (emailError) {
                console.error('[Email Error] Failed to send email:', emailError);
            }
        }

        // Important security practice: always return the same success message regardless of whether the email exists.
        // This prevents attackers from enumerating registered emails.
        res.status(200).json({
            success: true,
            message: 'If that email address is in our database, we will send you an email with a reset code.'
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error during password reset request'
        });
    }
}

// Handle password reset.
const resetPassword = async (req, res) => {
    try {
        const { email, resetCode, newPassword } = req.body;

        // 1. Basic validation: all three parameters are required.
        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset code, and new password are required'
            });
        }

        // 2. Call the service layer to reset the password.
        await userService.resetPassword(email, resetCode, newPassword);

        // 3. Return success.
        res.status(200).json({
            success: true,
            message: 'Password has been successfully reset'
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        
        // Convert specific service-layer errors into friendly frontend messages.
        if (error.message === 'Invalid code') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code or email'
            });
        }
        
        if (error.message === 'Code expired') {
            return res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one'
            });
        }

        // Other unknown server errors.
        res.status(500).json({
            success: false,
            message: 'Server Error during password reset'
        });
    }
};

// Export these functions for the route layer.
module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};

