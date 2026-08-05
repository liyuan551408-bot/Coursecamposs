const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendResetEmail = async (toEmail, resetCode) => {
    const mailOptions = {
        from: `"Course Compass" <${process.env.SMTP_USER}>`, 
        to: toEmail,                                           
        subject: '账户密码重置验证码',                         
        html: `
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2>密码重置请求</h2>
                <p>您正在尝试重置系统的账户密码。您的验证码是：</p>
                <h1 style="color: #007bff; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${resetCode}</h1>
                <p>该验证码将在 <strong>60 秒</strong> 后过期，请尽快输入。</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };