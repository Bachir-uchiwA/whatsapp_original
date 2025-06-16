const API_BASE_URL = 'https://projet-json-server-7.onrender.com';

// Adding CSS styles for messages and emoji picker
const style = document.createElement('style');
style.textContent = `
    .message-group { max-width: 100%; }
    .message-bubble {
        max-width: 70%;
        border-radius: 12px;
        position: relative;
        color: #fff;
    }
    .message-bubble.own {
        background: #056162;
        margin-left: auto;
    }
    .message-bubble.other {
        background: #262d31;
    }
    .message-time {
        font-size: 0.75rem;
        color: #a0aec0;
        text-align: right;
        margin-top: 4px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
    }
    .message-status {
        display: inline-flex;
        align-items: center;
    }
    .date-separator {
        text-align: center;
        margin: 16px 0;
    }
    .date-separator span {
        background: #2d3748;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        color: #a0aec0;
    }
    .voice-message {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .voice-waveform {
        display: flex;
        gap: 2px;
        align-items: center;
        flex-grow: 1;
    }
    .wave-bar {
        width: 3px;
        background: #a0aec0;
        border-radius: 2px;
    }
    .emoji-btn {
        font-size: 1.5rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
    }
    .emoji-btn:hover {
        background: #4a5568;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);

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

    static async addContact(contactData) {
        return await this.request('/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
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
            const rect = picker.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                picker.style.left = 'auto';
                picker.style.right = '0';
            }
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
        messageDiv.dataset.timestamp = message.timestamp;

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
        try {
            const messages = await ApiManager.getMessages(this.currentChatId);
            const message = messages.find(m => m.id === messageId);
            if (!message || !message.audioUrl) throw new Error('Audio non trouvé');

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
            chatSystem.showToast('Impossible de lire le message vocal', 'error');
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
        this.confirmCallback = null;
        this.recordingStartTime = null;
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
            this.renderNewChatContactsList(contacts);
        } catch (error) {
            console.error('Erreur chargement contacts:', error);
            this.showToast('Erreur lors du chargement des contacts', 'error');
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
                        <span class="text-white font-bold text-lg">${(contact.fullName?.charAt(0) || 'A').toUpperCase()}</span>
                    </div>
                    ${contact.status === 'online' ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>' : ''}
                </div>
                <div class="flex-1">
                    <div class="flex justify-between">
                        <span class="text-white font-semibold">${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}</span>
                        <span class="text-gray-500 text-xs">${this.messageManager.formatTime(new Date())}</span>
                    </div>
                    <div class="text-gray-400 text-sm truncate">${contact.phone}</div>
                </div>
            </div>
        `).join('');
    }

    renderNewChatContactsList(contacts) {
        const newChatContactsList = document.getElementById('newChatContactsList');
        if (!newChatContactsList) return;

        newChatContactsList.innerHTML = contacts.map(contact => `
            <div class="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer" 
                 data-contact-id="${contact.id}" 
                 onclick="chatSystem.selectContact('${contact.id}')">
                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white font-bold">${(contact.fullName?.charAt(0) || 'A').toUpperCase()}</span>
                </div>
                <div>
                    <p class="text-white">${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}</p>
                    <p class="text-gray-400 text-sm">${contact.phone}</p>
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
                this.hideNewChatPreview();
            }
        } catch (error) {
            console.error('Erreur sélection contact:', error);
            this.showToast('Erreur lors de la sélection du contact', 'error');
        }
    }

    renderChatInterface() {
        const chatHeader = document.getElementById('chatHeader');
        if (!chatHeader || !this.currentContact) return;

        chatHeader.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">${(this.currentContact.fullName?.charAt(0) || 'A').toUpperCase()}</span>
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

    async loadMessages() {
        try {
            const messages = await ApiManager.getMessages(this.currentChatId);
            this.renderMessages(messages);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            this.showToast('Erreur lors du chargement des messages', 'error');
        }
    }

    renderMessages(messages) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';
        let lastDate = null;

        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(message => {
            const messageDate = new Date(message.timestamp).toDateString();
            const showDate = lastDate !== messageDate;
            lastDate = messageDate;

            const messageElement = this.messageManager.createMessageElement(message, showDate);
            messagesContainer.appendChild(messageElement);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addMessageToInterface(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const lastMessage = messagesContainer.lastChild;
        const lastDate = lastMessage?.dataset?.timestamp ? new Date(lastMessage.dataset.timestamp).toDateString() : null;
        const messageDate = new Date(message.timestamp).toDateString();
        const showDate = lastDate !== messageDate;

        const messageElement = this.messageManager.createMessageElement(message, showDate);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                statusElement.innerHTML = this.messageManager.getMessageStatusIcon(status);
            }
        }
    }

    setupEventListeners() {
        const sidebarChatIcon = document.getElementById('sidebarChatIcon');
        const settingsIcon = document.getElementById('settingsIcon');
        const newChatBtn = document.getElementById('newChatBtn');
        const menuBtn = document.getElementById('menuBtn');
        const closePreview = document.getElementById('closePreview');
        const contactSearch = document.getElementById('contactSearch');
        const modalClose = document.getElementById('modal-close');
        const confirmOk = document.getElementById('confirm-ok');
        const confirmCancel = document.getElementById('confirm-cancel');
        const logoutBtn = document.getElementById('logoutBtn');
        const settingsLogout = document.getElementById('settingsLogout');
        const newContactBtn = document.getElementById('newContactBtn');
        const newContactSave = document.getElementById('new-contact-save');
        const newContactCancel = document.getElementById('new-contact-cancel');

        if (sidebarChatIcon) {
            sidebarChatIcon.addEventListener('click', () => this.showChats());
        }

        if (settingsIcon) {
            settingsIcon.addEventListener('click', () => this.showSettings());
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.showNewChatPreview());
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => this.toggleContextMenu(e));
        }

        if (closePreview) {
            closePreview.addEventListener('click', () => this.hideNewChatPreview());
        }

        if (contactSearch) {
            contactSearch.addEventListener('input', (e) => this.filterContacts(e.target.value));
        }

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal('modal'));
        }

        if (confirmOk) {
            confirmOk.addEventListener('click', () => this.handleConfirm());
        }

        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => this.hideModal('confirm-modal'));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.showConfirmModal('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', () => this.logout()));
        }

        if (settingsLogout) {
            settingsLogout.addEventListener('click', () => this.showConfirmModal('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', () => this.logout()));
        }

        if (newContactBtn) {
            newContactBtn.addEventListener('click', () => this.showNewContactModal());
        }

        if (newContactSave) {
            newContactSave.addEventListener('click', () => this.saveNewContact());
        }

        if (newContactCancel) {
            newContactCancel.addEventListener('click', () => this.hideModal('new-contact-modal'));
        }

        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu && !contextMenu.contains(e.target) && e.target !== menuBtn) {
                contextMenu.classList.add('hidden');
            }
        });
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
            this.showToast('Erreur lors de l\'envoi du message', 'error');
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            this.audioChunks = [];
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            const recordingIndicator = document.getElementById('recordingIndicator');
            const recordingTime = document.getElementById('recordingTime');
            if (recordingIndicator) recordingIndicator.classList.remove('hidden');

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

                const messageData = {
                    id: Date.now().toString(),
                    chatId: this.currentChatId,
                    sender: 'me',
                    type: 'voice',
                    audioUrl: audioUrl,
                    audioDuration: duration,
                    timestamp: new Date().toISOString(),
                    status: 'sending'
                };

                this.addMessageToInterface(messageData);

                try {
                    // Simulate saving audio to server (in practice, upload audioBlob to a storage service)
                    await ApiManager.saveMessage({
                        ...messageData,
                        audioUrl: 'mock-audio-url.webm' // Placeholder for actual URL
                    });
                    this.updateMessageStatus(messageData.id, 'sent');
                    setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
                    setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
                } catch (error) {
                    console.error('Erreur envoi message vocal:', error);
                    this.updateMessageStatus(messageData.id, 'failed');
                    this.showToast('Erreur lors de l\'envoi du message vocal', 'error');
                }

                stream.getTracks().forEach(track => track.stop());
                this.isRecording = false;
                if (recordingIndicator) recordingIndicator.classList.add('hidden');
                if (recordingTime) {
                    recordingTime.textContent = '0:00';
                    recordingTime.dataset.seconds = '0';
                }
            };

            this.mediaRecorder.start();

            // Update recording time display
            this.recordingTimer = setInterval(() => {
                if (recordingTime) {
                    const seconds = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    recordingTime.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
                    recordingTime.dataset.seconds = seconds;
                }
            }, 1000);

        } catch (error) {
            console.error('Erreur démarrage enregistrement:', error);
            this.showToast('Impossible de démarrer l\'enregistrement', 'error');
            this.isRecording = false;
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        clearInterval(this.recordingTimer);
        this.isRecording = false;
    }

    startPolling() {
        this.stopPolling();
        this.pollingInterval = setInterval(async () => {
            try {
                await this.loadMessages();
            } catch (error) {
                console.error('Erreur polling:', error);
            }
        }, 60000); // Poll every 60 seconds
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    showDefaultView() {
        const chatArea = document.getElementById('chatArea');
        if (chatArea) {
            chatArea.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
                    <i class="fas fa-comment-dots text-6xl mb-4"></i>
                    <h2 class="text-xl font-semibold">Sélectionnez une discussion</h2>
                    <p class="text-sm mt-2">Choisissez un contact pour commencer à discuter.</p>
                </div>
            `;
        }
    }

    showChats() {
        document.getElementById('sidebarChats').classList.remove('hidden');
        document.getElementById('sidebarSettings').classList.add('hidden');
        document.getElementById('newChatPreview').classList.add('hidden');
        document.getElementById('tempPreview').classList.add('hidden');
    }

    showSettings() {
        document.getElementById('sidebarChats').classList.add('hidden');
        document.getElementById('sidebarSettings').classList.remove('hidden');
        document.getElementById('newChatPreview').classList.add('hidden');
        document.getElementById('tempPreview').classList.add('hidden');
    }

    showNewChatPreview() {
        document.getElementById('sidebarChats').classList.add('hidden');
        document.getElementById('newChatPreview').classList.remove('hidden');
        document.getElementById('sidebarSettings').classList.add('hidden');
        document.getElementById('tempPreview').classList.add('hidden');
    }

    hideNewChatPreview() {
        document.getElementById('newChatPreview').classList.add('hidden');
        document.getElementById('sidebarChats').classList.remove('hidden');
    }

    showNewContactModal() {
        const modal = document.getElementById('new-contact-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('newContactName').value = '';
            document.getElementById('newContactPhone').value = '';
        }
    }

    async saveNewContact() {
        const nameInput = document.getElementById('newContactName');
        const phoneInput = document.getElementById('newContactPhone');
        if (!nameInput.value.trim() || !phoneInput.value.trim()) {
            this.showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        const contactData = {
            id: Date.now().toString(),
            fullName: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            status: 'offline'
        };

        try {
            await ApiManager.addContact(contactData);
            this.hideModal('new-contact-modal');
            await this.loadContacts();
            this.showToast('Contact ajouté avec succès', 'info');
        } catch (error) {
            console.error('Erreur ajout contact:', error);
            this.showToast('Erreur lors de l\'ajout du contact', 'error');
        }
    }

    toggleContextMenu(event) {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu.classList.contains('hidden')) {
            contextMenu.classList.remove('hidden');
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.clientY}px`;
        } else {
            contextMenu.classList.add('hidden');
        }
    }

    async filterContacts(query) {
        try {
            const contacts = await ApiManager.getContacts();
            const filtered = contacts.filter(contact =>
                (contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`).toLowerCase().includes(query.toLowerCase()) ||
                (contact.phone || '').includes(query)
            );
            this.renderContactsList(filtered);
        } catch (error) {
            console.error('Erreur filtrage contacts:', error);
            this.showToast('Erreur lors du filtrage des contacts', 'error');
        }
    }

    showModal(message, iconClass = 'fas fa-info-circle text-blue-400') {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modal-message');
        const modalIcon = document.getElementById('modal-icon');
        if (modal && modalMessage && modalIcon) {
            modalMessage.textContent = message;
            modalIcon.innerHTML = `<i class="${iconClass}"></i>`;
            modal.classList.remove('hidden');
        }
    }

    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMessage = document.getElementById('confirm-message');
        if (modal && confirmTitle && confirmMessage) {
            confirmTitle.textContent = title;
            confirmMessage.textContent = message;
            this.confirmCallback = onConfirm;
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.hideModal('confirm-modal');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600';
        toast.className = `bg-opacity-90 ${bgColor} text-white rounded-lg px-4 py-2 shadow-lg animate-pulse`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    logout() {
        this.showToast('Déconnexion réussie', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Initialisation
let chatSystem;
document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new ChatSystem();
});