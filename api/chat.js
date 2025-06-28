// Echo5 Hybrid Chatbot JS (for Node.js backend)
document.addEventListener('DOMContentLoaded', function() {
    var backendUrl = echo5_chatbot_hybrid_data.backend_url;
    var openaiApiKey = echo5_chatbot_hybrid_data.openai_api_key;
    const elements = {
        chatContainer: document.getElementById('echo5-chat-container'),
        chatHeader: document.getElementById('echo5-chat-header'),
        chatMessages: document.getElementById('echo5-chat-messages'),
        messageInput: document.getElementById('echo5-chat-message-input'),
        sendMessageButton: document.getElementById('echo5-send-message-button')
    };
    let chatSessionId = 'session_' + Date.now();
    let isMinimized = true;

    elements.chatHeader.addEventListener('click', function() {
        if (isMinimized) {
            elements.chatContainer.classList.remove('minimized');
            isMinimized = false;
            elements.messageInput.focus();
        }
    });
    elements.sendMessageButton.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    function displayUserMessage(message) {
        const div = document.createElement('div');
        div.className = 'echo5-message echo5-user-message';
        div.innerHTML = `<div class=\"echo5-message-content\"><strong>You</strong><p>${message}</p></div>`;
        elements.chatMessages.appendChild(div);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    function displayBotMessage(message) {
        const div = document.createElement('div');
        div.className = 'echo5-message echo5-bot-message';
        div.innerHTML = `<div class=\"echo5-message-content\"><strong>Bot</strong><p>${message}</p></div>`;
        elements.chatMessages.appendChild(div);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    async function sendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message) return;
        displayUserMessage(message);
        elements.messageInput.value = '';
        // Typing indicator
        const template = document.getElementById('echo5-typing-indicator-template');
        const typingIndicator = template.content.cloneNode(true).querySelector('.echo5-typing-indicator');
        elements.chatMessages.appendChild(typingIndicator);
        typingIndicator.style.display = 'block';
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(openaiApiKey ? { 'x-openai-key': openaiApiKey } : {})
                },
                body: JSON.stringify({ message, sessionId: chatSessionId })
            });
            const data = await response.json();
            typingIndicator.remove();
            if (response.ok && data.reply) {
                displayBotMessage(data.reply);
            } else {
                displayBotMessage('Error: ' + (data.reply || 'Something went wrong'));
            }
        } catch (error) {
            typingIndicator.remove();
            displayBotMessage('Error: Could not connect to the server.');
        }
    }
});
