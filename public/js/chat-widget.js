// public/js/chat-widget.js
document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML for chat widget if not present
    if (!document.querySelector('.chat-widget-wrapper')) {
        const widgetHtml = `
        <div class="chat-widget-wrapper">
            <button class="chat-toggle-btn" id="chatToggleBtn" title="Asistencia y Mensajes con Docente">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1s-.45 1-1 1zm0-3h-8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1s-.45 1-1 1zm-4 6H9c-.55 0-1-.45-1-1s.45-1 1-1h4c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                </svg>
                <span class="chat-tooltip">💬 Chatear con Soporte / Docente</span>
                <span class="chat-unread-badge" id="chatUnreadBadge">0</span>
            </button>
            
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <img src="/img/mascota/saludar.png" alt="UDECIA" class="chat-header-img">
                    <div class="chat-header-info">
                        <h3>Asistencia UDECIA / Profe</h3>
                        <p>En línea</p>
                    </div>
                    <button class="chat-close-btn" id="chatCloseBtn" aria-label="Cerrar chat">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message received">
                        ¡Hola! Soy UDECIA, tu asistente. También puedes usar este chat para hablar con tu profesor o administrador. ¿En qué te ayudo?
                        <span class="chat-time">Ahora</span>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Escribe un mensaje...">
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
    
    let pollInterval;
    let isOpen = false;

    // Load initial messages (mocked for frontend structure, assume API exists)
    async function loadMessages() {
        try {
            const res = await fetch('/messages/mine');
            if (res.ok) {
                const data = await res.json();
                renderMessages(data.messages);
                updateBadge(data.unreadCount);
            }
        } catch (e) {
            console.error('Error loading messages', e);
        }
    }

    function renderMessages(messages) {
        if (!messages || messages.length === 0) return;
        
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const text = msg.MessageText || msg.Content || '';
            // Si ReceiverID es NULL, el estudiante lo envió a los administradores
            const isSent = (msg.ReceiverID === null);
            appendMessage(text, isSent ? 'sent' : 'received', msg.CreatedAt || msg.SentAt);
        });
        scrollToBottom();
    }

    function appendMessage(text, type, timeStr = new Date().toISOString()) {
        const time = new Date(timeStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${type}`;
        msgDiv.innerHTML = `${text} <span class="chat-time">${time}</span>`;
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

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        sendBtn.disabled = true;

        try {
            const res = await fetch('/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, content: text, subject: 'Mensaje de estudiante' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                appendMessage(text, 'sent');
            } else {
                alert(data.message || 'Error al enviar el mensaje. Por favor intenta de nuevo.');
                chatInput.value = text;
            }
        } catch (e) {
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
            
            // Trigger mascot change if global function exists
            if (typeof window.triggerMascota === 'function') {
                window.triggerMascota('chatear', '¿En qué puedo ayudarte?');
            }
            
            scrollToBottom();
            
            // Start polling
            loadMessages(); // immediate load
            pollInterval = setInterval(loadMessages, 30000); // every 30s
        } else {
            chatWindow.classList.remove('open');
            clearInterval(pollInterval);
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', () => { if(isOpen) toggleChat(); });
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Initial check
    loadMessages();
});
