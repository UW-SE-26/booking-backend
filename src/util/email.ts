import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (data: nodemailer.SendMailOptions): Promise<SMTPTransport.SentMessageInfo> => {
    console.log(`Sending email to ${data.to}`);
    return transporter.sendMail(data);
};

export default sendEmail;
