// Echo5 Hybrid Chatbot JS (for Node.js backend)
document.addEventListener('DOMContentLoaded', function() {
    var backendUrl = echo5_chatbot_hybrid_data.backend_url;
    var openaiApiKey = echo5_chatbot_hybrid_data.openai_api_key;
    var systemPrompt = echo5_chatbot_hybrid_data.system_prompt || '';
    var faq = echo5_chatbot_hybrid_data.faq || '';
    const elements = {
        chatContainer: document.getElementById('echo5-chat-container'),
        chatHeader: document.getElementById('echo5-chat-header'),
        chatMessages: document.getElementById('echo5-chat-messages'),
        messageInput: document.getElementById('echo5-chat-message-input'),
        sendMessageButton: document.getElementById('echo5-send-message-button')
    };
    let chatSessionId = 'session_' + Date.now();
    let isMinimized = true;
    let userName = null;
    let awaitingName = false;

    // Add a name prompt box to the chat UI
    let namePromptBox = null;
    function showNamePromptBox() {
        if (namePromptBox) return;
        namePromptBox = document.createElement('div');
        namePromptBox.className = 'echo5-name-prompt-box';
        namePromptBox.innerHTML = `
            <div class="echo5-name-prompt-label">Hi! What is your name?</div>
            <input type="text" class="echo5-name-prompt-input" placeholder="Enter your name..." />
            <button class="echo5-name-prompt-btn">OK</button>
        `;
        elements.chatMessages.appendChild(namePromptBox);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        const input = namePromptBox.querySelector('.echo5-name-prompt-input');
        const btn = namePromptBox.querySelector('.echo5-name-prompt-btn');
        input.focus();
        btn.onclick = submitNamePrompt;
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitNamePrompt();
        });
    }
    function hideNamePromptBox() {
        if (namePromptBox) {
            namePromptBox.remove();
            namePromptBox = null;
        }
    }
    function submitNamePrompt() {
        const input = namePromptBox.querySelector('.echo5-name-prompt-input');
        const name = input.value.trim();
        if (!name) return;
        userName = name;
        sessionStorage.setItem('echo5_chatbot_user_name', userName);
        awaitingName = false;
        displayUserMessage(userName);
        hideNamePromptBox();
        greetWithSystemPrompt();
    }
    function askUserNameInChat() {
        awaitingName = true;
        showNamePromptBox();
    }

    function greetWithSystemPrompt() {
        // Custom greeting message with name
        displayBotMessage('Hello ' + userName + '! Nice to meet you.');
        if (systemPrompt) {
            displayBotMessage(systemPrompt.replace(/\\buser\\b|\\bUser\\b/g, userName));
        } else {
            displayBotMessage('How can I help you today?');
        }
    }

    elements.chatHeader.addEventListener('click', function() {
        if (isMinimized) {
            elements.chatContainer.classList.remove('minimized');
            isMinimized = false;
            elements.messageInput.focus();
            askUserNameInChat();
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
        const botName = (window.echo5_chatbot_hybrid_data && window.echo5_chatbot_hybrid_data.bot_name) ? window.echo5_chatbot_hybrid_data.bot_name : 'Bot';
        const div = document.createElement('div');
        div.className = 'echo5-message echo5-bot-message';
        div.innerHTML = `<div class=\"echo5-message-content\"><strong>${botName}</strong><p>${message}</p></div>`;
        elements.chatMessages.appendChild(div);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
    function setTypingIndicatorStyle(typingIndicator) {
        if (!window.echo5_chatbot_hybrid_data) return;
        const color = echo5_chatbot_hybrid_data.typing_color || '#2d8cff';
        const speed = echo5_chatbot_hybrid_data.typing_speed || '1';
        typingIndicator.style.setProperty('--echo5-typing-color', color);
        typingIndicator.style.setProperty('--echo5-typing-speed', speed + 's');
    }
    async function sendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message) return;
        displayUserMessage(message);
        elements.messageInput.value = '';
        if (awaitingName) {
            userName = message;
            sessionStorage.setItem('echo5_chatbot_user_name', userName);
            awaitingName = false;
            greetWithSystemPrompt();
            return;
        }
        // Typing indicator
        const template = document.getElementById('echo5-typing-indicator-template');
        const typingIndicator = template.content.cloneNode(true).querySelector('.echo5-typing-indicator');
        setTypingIndicatorStyle(typingIndicator);
        elements.chatMessages.appendChild(typingIndicator);
        typingIndicator.style.display = 'block';
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        const minTypingTime = 500; // ms
        const start = Date.now();
        let data, response;
        try {
            response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(openaiApiKey ? { 'x-openai-key': openaiApiKey } : {})
                },
                body: JSON.stringify({ message, sessionId: chatSessionId, systemPrompt, faq })
            });
            data = await response.json();
        } catch (error) {
            data = { reply: 'Error: ' + (error.message || 'Something went wrong') };
        }
        // Calculate delay based on reply length (simulate human typing)
        let replyText = (data && data.reply) ? String(data.reply) : '';
        let charCount = replyText.replace(/\s/g, '').length;
        let delayPerChar = 35; // ms per character (tweak for realism)
        let maxDelay = 3000; // max 3 seconds
        let minDelay = 500; // min 0.5 seconds
        let typingDelay = Math.min(maxDelay, Math.max(minDelay, charCount * delayPerChar));
        const elapsed = Date.now() - start;
        if (elapsed < typingDelay) {
            await new Promise(res => setTimeout(res, typingDelay - elapsed));
        }
        typingIndicator.remove();
        if (response && response.ok && data.reply) {
            displayBotMessage(data.reply);
        } else {
            displayBotMessage('Error: ' + (data.reply || 'Something went wrong'));
        }
    }
});
