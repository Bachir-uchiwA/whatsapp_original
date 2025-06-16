const API_BASE_URL = 'https://projet-json-server-7.onrender.com';

// Système de gestion des API
class ApiManager {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { 
                    'Content-Type': 'application/json', 
                    ...options.headers 
                },
                ...options,
                credentials: 'omit'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async getContacts() {
        return await this.request('/contacts');
    }

    static async getMessages(chatId = null) {
        const endpoint = chatId ? `/messages?chatId=${chatId}` : '/messages';
        return await this.request(endpoint);
    }

    static async saveMessage(messageData) {
        return await this.request('/messages', { 
            method: 'POST', 
            body: JSON.stringify(messageData) 
        });
    }

    static async updateMessageStatus(messageId, status) {
        return await this.request(`/messages/${messageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
}

// Système de gestion des emojis
class EmojiManager {
    constructor() {
        this.emojis = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
            gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤘', '🤙', '👈', '👉', '👆'],
            hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔']
        };
        this.currentCategory = 'smileys';
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createEmojiPicker();
        this.setupEventListeners();
    }

    createEmojiPicker() {
        const picker = document.getElementById('emojiPicker');
        if (!picker) return;

        const categories = document.createElement('div');
        categories.className = 'flex gap-2 mb-3 border-b border-gray-600 pb-2';
        
        Object.keys(this.emojis).forEach(category => {
            const tab = document.createElement('button');
            tab.className = `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                category === this.currentCategory ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`;
            tab.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            tab.onclick = () => this.switchCategory(category);
            categories.appendChild(tab);
        });

        picker.appendChild(categories);
        this.updateEmojiGrid();
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.updateEmojiGrid();
        const tabs = document.querySelectorAll('#emojiPicker button');
        tabs.forEach(tab => {
            tab.className = `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                tab.textContent.toLowerCase() === category ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`;
        });
    }

    updateEmojiGrid() {
        const grid = document.getElementById('emojiGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.emojis[this.currentCategory].forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-btn';
            button.textContent = emoji;
            button.onclick = () => this.selectEmoji(emoji);
            grid.appendChild(button);
        });
    }

    selectEmoji(emoji) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            const cursorPos = messageInput.selectionStart;
            messageInput.value = messageInput.value.substring(0, cursorPos) + emoji + messageInput.value.substring(cursorPos);
            messageInput.focus();
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
            messageInput.dispatchEvent(new Event('input'));
        }
        this.hide();
    }

    show() {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.remove('hidden');
            this.isVisible = true;
        }
    }

    hide() {
        const picker = document.getElementById('emojiPicker');
        if (picker) {
            picker.classList.add('hidden');
            this.isVisible = false;
        }
    }

    toggle() {
        this.isVisible ? this.hide() : this.show();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            if (picker && !picker.contains(e.target) && e.target !== emojiBtn) {
                this.hide();
            }
        });
    }
}

// Système de gestion des messages
class MessageManager {
    constructor() {
        this.messages = new Map();
        this.currentChatId = null;
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (date.toDateString() === yesterday.toDateString()) return "Hier";
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    getMessageStatusIcon(status) {
        switch (status) {
            case 'sending': return '<i class="fas fa-clock text-gray-400 text-xs"></i>';
            case 'sent': return '<i class="fas fa-check text-gray-400 text-xs"></i>';
            case 'delivered': return '<i class="fas fa-check-double text-gray-400 text-xs"></i>';
            case 'read': return '<i class="fas fa-check-double text-blue-400 text-xs"></i>';
            default: return '';
        }
    }

    createMessageElement(message, showDate = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-group mb-4';
        messageDiv.dataset.messageId = message.id;

        let html = showDate ? `
            <div class="date-separator">
                <span>${this.formatDate(message.timestamp)}</span>
            </div>
        ` : '';

        const isOwn = message.sender === 'me';
        html += `
            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2">
                <div class="message-bubble ${isOwn ? 'own' : 'other'} p-3">
                    ${this.renderMessageContent(message)}
                    <div class="message-time">
                        ${this.formatTime(message.timestamp)}
                        ${isOwn ? `<span class="message-status">${this.getMessageStatusIcon(message.status)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        messageDiv.innerHTML = html;
        return messageDiv;
    }

    renderMessageContent(message) {
        switch (message.type) {
            case 'text':
                return `<div class="break-words">${message.content}</div>`;
            case 'voice':
                return `
                    <div class="voice-message">
                        <button class="play-btn w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white" data-message-id="${message.id}" data-playing="false">
                            <i class="fas fa-play text-xs"></i>
                        </button>
                        <div class="voice-waveform">${this.generateWaveform()}</div>
                        <span class="text-xs text-gray-600">${this.formatDuration(message.audioDuration || 10)}</span>
                    </div>
                `;
            default:
                return `<div class="break-words">Type non supporté</div>`;
        }
    }

    generateWaveform() {
        let waveform = '';
        for (let i = 0; i < 15; i++) {
            const height = Math.random() * 15 + 5;
            waveform += `<div class="wave-bar" style="height: ${height}px;"></div>`;
        }
        return waveform;
    }

    formatDuration(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    async playVoiceMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        const playBtn = messageElement.querySelector('.play-btn');
        const isPlaying = playBtn.dataset.playing === 'true';

        if (isPlaying) {
            const audio = document.getElementById(`audio-${messageId}`);
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                playBtn.dataset.playing = 'false';
                playBtn.innerHTML = '<i class="fas fa-play text-xs"></i>';
            }
            return;
        }

        try {
            const messages = await ApiManager.getMessages(this.currentChatId);
            const message = messages.find(m => m.id === messageId);
            if (!message || !message.audioUrl) throw new Error('Audio non trouvé');

            let audio = document.getElementById(`audio-${messageId}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-${messageId}`;
                audio.src = message.audioUrl;
                audio.style.display = 'none';
                messageElement.appendChild(audio);
            }

            audio.play();
            playBtn.dataset.playing = 'true';
            playBtn.innerHTML = '<i class="fas fa-pause text-xs"></i>';

            audio.onended = () => {
                playBtn.dataset.playing = 'false';
                playBtn.innerHTML = '<i class="fas fa-play text-xs"></i>';
            };
        } catch (error) {
            console.error('Erreur de lecture:', error);
            alert('Impossible de lire le message vocal.');
        }
    }
}

// Système principal de chat
class ChatSystem {
    constructor() {
        this.currentChatId = null;
        this.currentContact = null;
        this.messageManager = new MessageManager();
        this.emojiManager = new EmojiManager();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.pollingInterval = null;
        this.init();
    }

    async init() {
        await this.loadContacts();
        this.setupEventListeners();
        this.showDefaultView();
    }

    async loadContacts() {
        try {
            const contacts = await ApiManager.getContacts();
            this.renderContactsList(contacts);
        } catch (error) {
            console.error('Erreur chargement contacts:', error);
        }
    }

    renderContactsList(contacts) {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        contactsList.innerHTML = contacts.map(contact => `
            <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" 
                 data-contact-id="${contact.id}" 
                 onclick="chatSystem.selectContact('${contact.id}')">
                <div class="relative">
                    <div class="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">${(contact.firstName?.charAt(0) || 'A').toUpperCase()}</span>
                    </div>
                    ${contact.status === 'online' ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>' : ''}
                </div>
                <div class="flex-1">
                    <div class="flex justify-between">
                        <span class="text-white font-semibold">${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}</span>
                        <span class="text-gray-500 text-xs">12:00</span>
                    </div>
                    <div class="text-gray-400 text-sm truncate">${contact.phone}</div>
                </div>
            </div>
        `).join('');
    }

    async selectContact(contactId) {
        this.stopPolling();
        try {
            const contacts = await ApiManager.getContacts();
            this.currentContact = contacts.find(c => c.id === contactId);
            this.currentChatId = contactId;
            this.messageManager.currentChatId = contactId;
            
            if (this.currentContact) {
                this.renderChatInterface();
                await this.loadMessages();
                this.startPolling();
            }
        } catch (error) {
            console.error('Erreur sélection contact:', error);
        }
    }

    renderChatInterface() {
        const chatHeader = document.getElementById('chatHeader');
        if (!chatHeader || !this.currentContact) return;

        chatHeader.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">${(this.currentContact.firstName?.charAt(0) || 'A').toUpperCase()}</span>
                </div>
                <div>
                    <h2 class="text-white font-semibold">${this.currentContact.fullName || `${this.currentContact.firstName || ''} ${this.currentContact.lastName || ''}`}</h2>
                    <p class="text-gray-400 text-sm">${this.currentContact.status === 'online' ? 'en ligne' : 'hors ligne'}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700" title="Appel vocal"><i class="fas fa-phone text-xl"></i></button>
                <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700" title="Rechercher"><i class="fas fa-search text-xl"></i></button>
            </div>
        `;

        this.setupChatEventListeners();
    }

    setupEventListeners() {
        // Global event listeners
    }

    setupChatEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const recordBtn = document.getElementById('recordBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const charCount = document.getElementById('charCount');

        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                charCount.textContent = e.target.value.length;
                sendBtn.classList.toggle('hidden', e.target.value.length === 0);
                recordBtn.classList.toggle('hidden', e.target.value.length > 0);
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (emojiBtn) emojiBtn.addEventListener('click', () => this.emojiManager.toggle());
        if (recordBtn) {
            recordBtn.addEventListener('mousedown', () => this.startRecording());
            recordBtn.addEventListener('mouseup', () => this.stopRecording());
            recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startRecording(); });
            recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.stopRecording(); });
        }

        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.play-btn');
                if (playBtn) {
                    this.messageManager.playVoiceMessage(playBtn.dataset.messageId);
                }
            });
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !messageInput.value.trim() || !this.currentChatId) return;

        const messageData = {
            id: Date.now().toString(),
            chatId: this.currentChatId,
            sender: 'me',
            content: messageInput.value.trim(),
            type: 'text',
            timestamp: new Date().toISOString(),
            status: 'sending'
        };

        this.addMessageToInterface(messageData);
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('sendBtn').classList.add('hidden');
        document.getElementById('recordBtn').classList.remove('hidden');

        try {
            await ApiManager.saveMessage(messageData);
            this.updateMessageStatus(messageData.id, 'sent');
            setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
            setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.updateMessageStatus(messageData.id, 'failed');
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    await this.sendVoiceMessage(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                    this.audioChunks = [];
                } catch (error) {
                    console.error('Erreur lors de l\'envoi du message vocal:', error);
                    alert('Erreur lors de l\'envoi du message vocal.');
                }
            };

            this.isRecording = true;
            this.mediaRecorder.start();
            
            document.getElementById('recordingIndicator').classList.remove('hidden');
            document.getElementById('recordBtn').classList.add('bg-red-600');
            this.startRecordingTimer();
        } catch (error) {
            console.error('Erreur microphone:', error);
            alert('Impossible d\'accéder au microphone.');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.isRecording = false;
        try {
            this.mediaRecorder.stop();
        } catch (error) {
            console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
        }
        
        document.getElementById('recordingIndicator').classList.add('hidden');
        document.getElementById('recordBtn').classList.remove('bg-red-600');
        this.stopRecordingTimer();
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            let seconds = parseInt(document.getElementById('recordingTime').dataset.seconds || 0);
            seconds++;
            document.getElementById('recordingTime').dataset.seconds = seconds;
            document.getElementById('recordingTime').textContent = this.messageManager.formatDuration(seconds);
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
            document.getElementById('recordingTime').dataset.seconds = 0;
            document.getElementById('recordingTime').textContent = '0:00';
        }
    }

    async sendVoiceMessage(audioBlob) {
        if (!this.currentChatId) return;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                try {
                    const base64Data = reader.result;

                    const messageData = {
                        id: Date.now().toString(),
                        chatId: this.currentChatId,
                        sender: 'me',
                        type: 'voice',
                        timestamp: new Date().toISOString(),
                        status: 'sending',
                        audioUrl: base64Data,
                        audioDuration: Math.round(audioBlob.size / 5000) // Approx duration
                    };

                    this.addMessageToInterface(messageData);

                    await ApiManager.saveMessage(messageData);
                    this.updateMessageStatus(messageData.id, 'sent');
                    setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
                    setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
                } catch (error) {
                    console.error('Erreur envoi message vocal:', error);
                    this.updateMessageStatus(messageData.id, 'failed');
                    alert('Erreur lors de l\'envoi du message vocal.');
                }
            };
            reader.onerror = error => {
                console.error('Erreur lecture fichier audio:', error);
                alert('Erreur lors de la lecture du fichier audio.');
            };
        } catch (error) {
            console.error('Erreur préparation message vocal:', error);
            alert('Erreur lors de la préparation du message vocal.');
        }
    }

    addMessageToInterface(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const lastMessage = messagesContainer.lastElementChild;
        const showDate = !lastMessage || !this.isSameDay(new Date(lastMessage.dataset.timestamp || 0), new Date(message.timestamp));

        const messageElement = this.messageManager.createMessageElement(message, showDate);
        messageElement.dataset.timestamp = message.timestamp;
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const statusElement = messageElement.querySelector('.message-status');
        if (statusElement) {
            statusElement.innerHTML = this.messageManager.getMessageStatusIcon(status);
        }
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    async loadMessages() {
        if (!this.currentChatId) return;

        try {
            const messages = await ApiManager.getMessages(this.currentChatId);
            const messagesContainer = document.getElementById('messagesContainer');
            if (!messagesContainer) return;

            messagesContainer.innerHTML = messages.length === 0 ? `
                <div class="text-center text-gray-500 text-sm py-8">
                    Aucun message. Commencez la conversation !
                </div>
            ` : '';

            messages.forEach((messageData, index) => {
                const showDate = index === 0 || !this.isSameDay(new Date(messages[index - 1].timestamp), new Date(messageData.timestamp));
                const messageElement = this.messageManager.createMessageElement(messageData, showDate);
                messageElement.dataset.timestamp = messageData.timestamp;
                messagesContainer.appendChild(messageElement);
            });

            this.scrollToBottom();
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    startPolling() {
        if (this.pollingInterval) return;
        this.pollingInterval = setInterval(async () => {
            if (this.currentChatId) {
                try {
                    const messages = await ApiManager.getMessages(this.currentChatId);
                    this.updateMessages(messages);
                } catch (error) {
                    console.error('Erreur polling:', error);
                }
            }
        }, 5000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    updateMessages(newMessages) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const currentMessageIds = Array.from(messagesContainer.querySelectorAll('[data-message-id]')).map(el => el.dataset.messageId);

        newMessages.forEach((message, index) => {
            if (!currentMessageIds.includes(message.id)) {
                const showDate = index === 0 || !this.isSameDay(new Date(newMessages[index - 1].timestamp), new Date(message.timestamp));
                const messageElement = this.messageManager.createMessageElement(message, showDate);
                messageElement.dataset.timestamp = message.timestamp;
                messagesContainer.appendChild(messageElement);
            }
        });

        this.scrollToBottom();
    }

    showDefaultView() {
        this.stopPolling();
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;

        chatArea.innerHTML = `
            <div class="flex-1 bg-gray-800 flex items-center justify-center">
                <div class="text-center text-gray-500 text-sm">
                    Sélectionnez un contact pour commencer une conversation.
                </div>
            </div>
        `;
    }
}

// Initialisation
let chatSystem;
let messageManager;

document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new ChatSystem();
    messageManager = chatSystem.messageManager;
});