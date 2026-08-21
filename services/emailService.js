const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
    },
});

exports.sendVerificationPin = async (to, pin) => {
    // Si no hay configuración SMTP, solo imprime el PIN en consola
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`\n\n======================================================`);
        console.log(`🔔 [MODO DESARROLLO] SIMULANDO ENVÍO DE CORREO`);
        console.log(`Para: ${to}`);
        console.log(`Tu PIN de verificación es: ${pin}`);
        console.log(`======================================================\n\n`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: '"SaberPro Inglés" <' + process.env.SMTP_USER + '>',
            to: to,
            subject: '🔑 Código de Verificación - SaberPro Inglés',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #7c3aed; text-align: center;">¡Bienvenido a SaberPro Inglés!</h2>
                    <p style="font-size: 16px; color: #333;">Hola,</p>
                    <p style="font-size: 16px; color: #333;">Gracias por registrarte. Para activar tu cuenta, ingresa el siguiente código de seguridad en la pantalla de registro:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${pin}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">Este código expirará en 15 minutos.</p>
                    <p style="font-size: 14px; color: #666;">Si no solicitaste este registro, ignora este correo.</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Error enviando email:', error);
        return false;
    }
};
