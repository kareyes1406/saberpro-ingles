const Message = require('../models/Message');
const ChatbotService = require('../services/chatbotService');

class MessageController {
    async sendMessage(req, res) {
        try {
            const senderId = req.session.userId || req.session.user?.UserID;
            if (!senderId) {
                return res.status(401).json({ success: false, message: 'Sesión no válida o expirada. Por favor recarga la página.' });
            }
            const { subject, text, content, receiverId, parentId } = req.body;
            const messageBody = text || content;
            if (!messageBody || messageBody.trim() === '') {
                return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
            }
            const targetReceiver = receiverId ? parseInt(receiverId, 10) : null;
            const parent = parentId ? parseInt(parentId, 10) : null;
            
            // Determinar si quien escribe es estudiante para activar el asistente UDECIA
            const isStudent = req.session.role === 'student' || !req.session.role;
            
            let botResult = null;
            if (isStudent && !targetReceiver) {
                botResult = ChatbotService.processMessage(messageBody, {
                    FirstName: req.session.user?.FirstName || '',
                    LastName: req.session.user?.LastName || '',
                    UserID: senderId
                });
            }

            // Asunto dinámico según si fue escalado a docentes
            let finalSubject = subject || 'Mensaje de estudiante';
            if (botResult && botResult.escalated) {
                finalSubject = '🚨 [SOPORTE DOCENTE REQUERIDO] ' + (req.session.user?.FirstName || 'Estudiante');
            } else if (botResult) {
                finalSubject = '💬 [CONSULTA ASISTENTE] ' + (req.session.user?.FirstName || 'Estudiante');
            }

            // Registrar mensaje del estudiante
            const insertedMsgId = await Message.sendMessage(
                senderId, 
                targetReceiver, 
                finalSubject, 
                messageBody.trim(), 
                parent
            );

            // Si el chatbot generó respuesta, registrarla en la base de datos (con emisor Admin UserID 1)
            let botReplyText = null;
            let isEscalated = false;
            if (botResult && botResult.reply) {
                botReplyText = botResult.reply;
                isEscalated = botResult.escalated;
                try {
                    await Message.sendMessage(
                        1, 
                        senderId, 
                        '🤖 Respuesta UDECIA', 
                        botReplyText, 
                        typeof insertedMsgId === 'number' ? insertedMsgId : null
                    );
                } catch (botDbErr) {
                    console.error('Advertencia guardando respuesta de bot en BD:', botDbErr);
                }
            }

            res.json({ 
                success: true, 
                message: 'Mensaje enviado correctamente.',
                botReply: botReplyText,
                escalated: isEscalated
            });
        } catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(500).json({ success: false, message: 'Error al enviar el mensaje.' });
        }
    }

    async getStudentMessages(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            const messages = await Message.getUserMessages(userId);
            const unreadCount = await Message.getUnreadCount(userId);
            res.json({ success: true, messages, unreadCount, currentUserId: userId });
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
            const unreadMessagesCount = await Message.getAdminUnreadCount();
            res.render('admin/messages', {
                messages,
                unreadMessagesCount,
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
            const userId = req.session.userId || req.session.user?.UserID;
            
            // Verificar que el mensaje pertenece al usuario actual
            const message = await Message.getThread(parseInt(id, 10));
            if (!message || (message.ReceiverID !== userId && req.session.role !== 'admin')) {
                return res.status(403).json({ error: 'No autorizado' });
            }
            
            await Message.markAsRead(parseInt(id, 10));
            res.json({ success: true });
        } catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({ success: false, message: 'Error al marcar como leído.' });
        }
    }
}

module.exports = new MessageController();
