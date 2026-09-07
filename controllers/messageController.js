const Message = require('../models/Message');

class MessageController {
    async sendMessage(req, res) {
        try {
            const senderId = req.session.userId || req.session.user?.UserID;
            const { subject, text, content, receiverId, parentId } = req.body;
            const messageBody = text || content;
            if (!messageBody || messageBody.trim() === '') {
                return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
            }
            const targetReceiver = receiverId ? parseInt(receiverId, 10) : null;
            const parent = parentId ? parseInt(parentId, 10) : null;
            
            await Message.sendMessage(senderId, targetReceiver, subject || 'Mensaje', messageBody, parent);
            res.json({ success: true, message: 'Mensaje enviado correctamente.' });
        } catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(500).json({ success: false, message: 'Error al enviar el mensaje.' });
        }
    }

    async getStudentMessages(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            const messages = await Message.getUserMessages(userId);
            res.json({ success: true, messages });
        } catch (error) {
            console.error('Error in getStudentMessages:', error);
            res.status(500).json({ success: false, message: 'Error obteniendo los mensajes.' });
        }
    }

    async showAdminMessages(req, res) {
        try {
            if (req.session.role !== 'admin') {
                return res.redirect('/admin/dashboard');
            }
            const messages = await Message.getAdminInbox();
            res.render('admin/messages', {
                messages,
                title: 'Bandeja de Entrada',
                cssFile: 'admin.css',
                user: req.session.user
            });
        } catch (error) {
            console.error('Error in showAdminMessages:', error);
            res.redirect('/admin/dashboard');
        }
    }

    async replyMessage(req, res) {
        try {
            const senderId = req.session.userId || req.session.user?.UserID;
            const { subject, text, receiverId, parentId } = req.body;

            await Message.sendMessage(senderId, receiverId ? parseInt(receiverId, 10) : null, subject || 'Respuesta', text, parentId ? parseInt(parentId, 10) : null);
            res.json({ success: true, message: 'Respuesta enviada.' });
        } catch (error) {
            console.error('Error in replyMessage:', error);
            res.status(500).json({ success: false, message: 'Error al responder el mensaje.' });
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            await Message.markAsRead(parseInt(id, 10));
            res.json({ success: true });
        } catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({ success: false, message: 'Error al marcar como leído.' });
        }
    }
}

module.exports = new MessageController();
