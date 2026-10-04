// public/js/chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML for chat widget if not present
    if (!document.querySelector('.chat-widget-wrapper')) {
        const widgetHtml = `
        <div class="chat-widget-wrapper">
            <button class="chat-toggle-btn" id="chatToggleBtn" title="Asistencia UDECIA y Mensajes con Docente">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1s-.45 1-1 1zm0-3h-8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1s-.45 1-1 1zm-4 6H9c-.55 0-1-.45-1-1s.45-1 1-1h4c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                </svg>
                <span class="chat-tooltip">💬 Chatear con UDECIA / Docente</span>
                <span class="chat-unread-badge" id="chatUnreadBadge">0</span>
            </button>
            
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <img src="/img/mascota/saludar.png" alt="UDECIA" class="chat-header-img">
                    <div class="chat-header-info">
                        <h3>Asistente UDECIA</h3>
                        <p style="color:#10b981; font-size:0.75rem; display:flex; align-items:center; gap:0.25rem;">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
                            En línea 24/7 • Saber Pro
                        </p>
                    </div>
                    <button class="chat-close-btn" id="chatCloseBtn" aria-label="Cerrar chat">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <!-- Chips de consultas frecuentes -->
                <div class="chat-quick-chips" id="chatQuickChips">
                    <button class="chat-chip" data-query="¿Cómo desbloquear la siguiente semana?">🔓 Desbloquear semanas</button>
                    <button class="chat-chip" data-query="¿Cómo vencer al Jefe de Semana?">⚔️ Vencer al Jefe (75%)</button>
                    <button class="chat-chip" data-query="¿Para qué sirven las monedas y pistas?">🪙 Monedas y Pistas</button>
                    <button class="chat-chip" data-query="¿Qué es el Pre-Test y Post-Test?">📝 Pre y Post-Test</button>
                    <button class="chat-chip escalate" data-query="Quiero comunicarme con un profesor o docente">👨‍🏫 Hablar con Docente</button>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message received">
                        ¡Hola! Soy <strong>UDECIA</strong>, tu asistente de inglés. Puedes preguntarme sobre cómo desbloquear semanas, vencer al Jefe, ganar monedas o ver tus exámenes.
                        <br><br>
                        <em>Si tu problema no se soluciona, escribe <strong>"Hablar con docente"</strong> y transferiré tu mensaje a tu profesor.</em>
                        <span class="chat-time">Ahora</span>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Escribe tu duda o toca una opción...">
                    <button class="chat-send-btn" id="chatSendBtn" aria-label="Enviar mensaje">
                        <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', widgetHtml);
    }

    const toggleBtn = document.getElementById('chatToggleBtn');
    const closeBtn = document.getElementById('chatCloseBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const badge = document.getElementById('chatUnreadBadge');
    
    let pollInterval = null;
    let isOpen = false;
    let cachedUserId = null;

    function formatText(text) {
        if (!text) return '';
        let escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3); padding:1px 4px; border-radius:4px; color:#38bdf8;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Load initial messages
    async function loadMessages() {
        try {
            const res = await fetch('/messages/mine');
            if (res.ok) {
                const data = await res.json();
                if (data.currentUserId) cachedUserId = data.currentUserId;
                renderMessages(data.messages, cachedUserId);
                updateBadge(data.unreadCount);
            }
        } catch (e) {
            console.error('Error loading messages', e);
        }
    }

    function renderMessages(messages, currentUserId) {
        if (!messages || messages.length === 0) return;
        
        messagesContainer.innerHTML = '';
        
        // Mensaje inicial de bienvenida
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'chat-message received';
        welcomeDiv.innerHTML = `¡Hola! Soy <strong>UDECIA</strong>, tu asistente de inglés. Puedes preguntarme sobre cómo desbloquear semanas, vencer al Jefe, ganar monedas o ver tus exámenes.<br><br><em>Si tu problema no se soluciona, escribe <strong>"Hablar con docente"</strong> y transferiré tu mensaje a tu profesor.</em><span class="chat-time">Inicio</span>`;
        messagesContainer.appendChild(welcomeDiv);

        messages.forEach(msg => {
            const text = msg.MessageText || msg.Content || '';
            const isSent = currentUserId ? (msg.SenderID === currentUserId) : (msg.ReceiverID === null);
            const isEscalated = (msg.Subject && (msg.Subject.includes('SOPORTE DOCENTE') || msg.Subject.includes('ESCALADO')));
            appendMessage(text, isSent ? 'sent' : 'received', msg.CreatedAt || msg.SentAt, isEscalated && !isSent);
        });
        scrollToBottom();
    }

    function appendMessage(text, type, timeStr = new Date().toISOString(), isEscalated = false) {
        const time = new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${type}${isEscalated ? ' escalated-msg' : ''}`;
        
        let contentHtml = formatText(text);
        if (isEscalated) {
            contentHtml = `<div class="escalated-tag">🚨 Solicitud radicada con Docentes</div>` + contentHtml;
        }

        msgDiv.innerHTML = `${contentHtml} <span class="chat-time">${time}</span>`;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function updateBadge(count) {
        if (count > 0 && !isOpen) {
            badge.textContent = count;
            badge.classList.add('active');
        } else {
            badge.classList.remove('active');
        }
    }

    async function sendMessage(customText) {
        const text = (typeof customText === 'string' ? customText : chatInput.value).trim();
        if (!text) return;

        chatInput.value = '';
        sendBtn.disabled = true;

        // Render mensaje del usuario de inmediato
        appendMessage(text, 'sent');

        // Indicador de "escribiendo..."
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message received typing';
        typingIndicator.id = 'chatTypingIndicator';
        typingIndicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span> <em style="font-size:0.8rem; margin-left:0.3rem;">UDECIA está respondiendo...</em>';
        messagesContainer.appendChild(typingIndicator);
        scrollToBottom();

        try {
            const res = await fetch('/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, content: text, subject: 'Mensaje de estudiante' })
            });
            const data = await res.json();
            
            // Remover typing indicator
            const currentTyping = document.getElementById('chatTypingIndicator');
            if (currentTyping) currentTyping.remove();

            if (res.ok && data.success) {
                if (data.botReply) {
                    appendMessage(data.botReply, 'received', new Date().toISOString(), data.escalated);
                    if (data.escalated && typeof window.triggerMascota === 'function') {
                        window.triggerMascota('alertar', 'Tu consulta fue remitida al equipo docente.');
                    }
                }
            } else {
                alert(data.message || 'Error al enviar el mensaje. Por favor intenta de nuevo.');
                chatInput.value = text;
            }
        } catch (e) {
            const currentTyping = document.getElementById('chatTypingIndicator');
            if (currentTyping) currentTyping.remove();
            console.error('Error sending message', e);
            alert('Error de conexión al enviar tu mensaje. Revisa tu conexión a internet.');
            chatInput.value = text;
        } finally {
            sendBtn.disabled = false;
        }
    }

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('open');
            badge.classList.remove('active');
            chatInput.focus();
            
            if (typeof window.triggerMascota === 'function') {
                window.triggerMascota('chatear', '¿En qué puedo orientarte hoy?');
            }
            
            scrollToBottom();
            loadMessages();
            // Polling eficiente solo mientras la ventana está abierta (cada 30s)
            if (!pollInterval) {
                pollInterval = setInterval(loadMessages, 30000);
            }
        } else {
            chatWindow.classList.remove('open');
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', () => { if (isOpen) toggleChat(); });
    
    sendBtn.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Chips click listener
    document.querySelectorAll('.chat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            if (query) {
                sendMessage(query);
            }
        });
    });

    // Initial check for unread badge
    loadMessages();
});
