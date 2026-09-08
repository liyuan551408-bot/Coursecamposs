/** @file Translates user HTTP requests into service calls and API responses. */
const userService = require('../services/userService');

// Return the profile associated with the verified request identity.
const getMe = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        // Delegate persistence and public-field selection to the service layer.
        const user = await userService.findPublicUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update only profile fields owned by the verified user.
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, major, studyYear, interests, goals, planningPreferences } = req.body; // Accept only supported profile fields from the frontend.

        const updatedUser = await userService.updateUserProfile(userId, { name, major, studyYear, interests, goals, planningPreferences });

        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully', 
            data: updatedUser 
        });
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getMe,
    updateProfile
};
