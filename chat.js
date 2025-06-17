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
    .voice-message, .audio-message {
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
    .audio-player {
        width: 200px;
    }
    .settings-search {
        background: #2d3748;
        border: none;
        color: #a0aec0;
        padding: 8px;
        border-radius: 8px;
        width: 100%;
        margin-bottom: 16px;
        font-size: 14px;
    }
    .settings-profile {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #4a5568;
    }
    .settings-profile .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #34d399;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        position: relative;
    }
    .settings-profile .avatar .status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        background: #34d399;
        border: 2px solid #1a202c;
        border-radius: 50%;
    }
    .settings-profile .info .name {
        color: #fff;
        font-size: 16px;
        font-weight: 500;
    }
    .settings-profile .info .status-text {
        color: #a0aec0;
        font-size: 12px;
    }
    .settings-item {
        display: flex;
        flex-direction: column;
        padding: 12px;
        color: #fff;
        border-bottom: 1px solid #4a5568;
        min-height: 48px;
    }
    .settings-item i {
        margin-right: 12px;
        color: #34d399;
        font-size: 16px;
        width: 20px;
        text-align: center;
        margin-bottom: 4px;
    }
    .settings-item .main-text {
        font-size: 14px;
        color: #fff;
        margin-bottom: 2px;
    }
    .settings-item .subtext {
        color: #a0aec0;
        font-size: 12px;
        align-self: flex-start;
    }
    .logout-btn {
        background: #f87171;
        color: #fff;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        margin: 16px 12px 0;
        font-size: 14px;
        font-weight: 500;
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

    static async deleteSession() {
        return await this.request('/sessions/1', {
            method: 'DELETE'
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
            case 'audio':
                return `
                    <div class="${message.type}-message">
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

    async playAudioMessage(messageId) {
        try {
            const messages = await ApiManager.getMessages(this.currentChatId);
            const message = messages.find(m => m.id === messageId);
            if (!message || !message.audioData) throw new Error('Audio non trouvé');

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
                audio.src = message.audioData;
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
            chatSystem.showToast('Impossible de lire le message audio', 'error');
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
        this.currentView = 'chats';
        this.init();
    }

    async init() {
        await this.loadContacts();
        this.renderChatsView();
        this.setupEventListeners();
        this.showDefaultView();
    }

    async loadContacts() {
        try {
            const contacts = await ApiManager.getContacts();
            this.contacts = contacts;
        } catch (error) {
            console.error('Erreur chargement contacts:', error);
            this.showToast('Erreur lors du chargement des contacts', 'error');
        }
    }

    renderChatsView() {
        this.currentView = 'chats';
        const sidebarChats = document.getElementById('sidebarChats');
        if (!sidebarChats || !this.contacts) return;

        sidebarChats.innerHTML = `
            <div class="p-4 bg-gray-900 flex items-center space-x-4 border-b border-gray-700">
                <div class="relative">
                    <div class="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">A</span>
                    </div>
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-center">
                        <span class="text-white font-semibold text-lg">Utilisateur</span>
                        <div class="flex space-x-2">
                            <button id="newChatBtn" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700" title="Nouvelle discussion">
                                <i class="fas fa-comment-medical text-xl"></i>
                            </button>
                            <button id="menuBtn" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700" title="Menu">
                                <i class="fas fa-ellipsis-v text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-2 bg-gray-900">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                    <input id="contactSearch" type="text" placeholder="Rechercher ou démarrer une discussion" class="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
            </div>
            <div id="contactsList" class="flex-1 overflow-y-auto scrollbar-thin"></div>
            <div id="contextMenu" class="absolute hidden bg-gray-800 rounded-lg shadow-lg py-2 w-48 z-50">
                <button class="w-full text-left px-4 py-2 text-white hover:bg-gray-700">Nouvelle discussion</button>
                <button class="w-full text-left px-4 py-2 text-white hover:bg-gray-700">Nouveau groupe</button>
                <button class="w-full text-left px-4 py-2 text-white hover:bg-gray-700" id="menuSettingsBtn">Paramètres</button>
                <button id="logoutBtn" class="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700">Déconnexion</button>
            </div>
        `;

        this.renderContactsList(this.contacts);
        this.setupViewEventListeners();
    }

    renderSettingsView() {
        this.currentView = 'settings';
        const sidebarChats = document.getElementById('sidebarChats');
        if (!sidebarChats) return;

        sidebarChats.innerHTML = `
            <div class="p-4 bg-gray-900 flex items-center space-x-4 border-b border-gray-700">
                <button id="backToChats" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                    <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <h2 class="text-white font-semibold text-lg">Paramètres</h2>
            </div>
            <div class="p-4 bg-gray-900 flex flex-col h-full">
                <input type="text" placeholder="Rechercher dans les paramètres" class="settings-search mb-6">
                <div class="settings-profile mb-6">
                    <div class="avatar">
                        <img src="https://via.placeholder.com/50" alt="Profile" class="w-full h-full rounded-full">
                        <div class="status"></div>
                    </div>
                    <div class="info">
                        <div class="name">Bachir dev <span class="text-green-500 text-sm">🇱🇾🇽🇧❤️</span></div>
                        <div class="status-text">En ligne <span class="text-gray-400">• Salut ! Justifie WhatsApp.</span></div>
                    </div>
                </div>
                <div class="space-y-1 flex-1">
                    <div class="settings-item">
                        <i class="fas fa-user-shield"></i>
                        <span class="main-text">Compte</span>
                        <span class="subtext">Sécurité, informations de compte</span>
                    </div>
                    <div class="settings-item">
                        <i class="fas fa-lock"></i>
                        <span class="main-text">Confidentialité</span>
                        <span class="subtext">Contacts bloqués, messages éphémères</span>
                    </div>
                    <div class="settings-item">
                        <i class="fas fa-comments"></i>
                        <span class="main-text">Discussions</span>
                        <span class="subtext">Thème, fond d'écran, paramètres des discussions</span>
                    </div>
                    <div class="settings-item">
                        <i class="fas fa-bell"></i>
                        <span class="main-text">Notifications</span>
                        <span class="subtext">Notifications de messages</span>
                    </div>
                    <div class="settings-item">
                        <i class="fas fa-keyboard"></i>
                        <span class="main-text">Raccourcis clavier</span>
                        <span class="subtext">Actions rapides</span>
                    </div>
                    <div class="settings-item">
                        <i class="fas fa-question-circle"></i>
                        <span class="main-text">Aide</span>
                        <span class="subtext">Pages d'aide, contactez-nous, politique de confidentialité</span>
                    </div>
                </div>
                <button id="settingsLogout" class="logout-btn">Se déconnecter</button>
            </div>
        `;

        this.setupViewEventListeners();
    }

    renderNewChatView() {
        this.currentView = 'newChat';
        const sidebarChats = document.getElementById('sidebarChats');
        if (!sidebarChats || !this.contacts) return;

        sidebarChats.innerHTML = `
            <div class="p-4 bg-gray-900 flex items-center space-x-4 border-b border-gray-700">
                <button id="closePreview" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700">
                    <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <h2 class="text-white font-semibold text-lg">Nouvelle discussion</h2>
            </div>
            <div class="p-2 bg-gray-900">
                <button id="newContactBtn" class="w-full text-left p-3 text-white hover:bg-gray-700 rounded-lg flex items-center space-x-3">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-user-plus text-white"></i>
                    </div>
                    <span>Nouveau contact</span>
                </button>
            </div>
            <div id="newChatContactsList" class="flex-1 overflow-y-auto scrollbar-thin"></div>
        `;

        this.renderNewChatContactsList(this.contacts);
        this.setupViewEventListeners();
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

    setupViewEventListeners() {
        const newChatBtn = document.getElementById('newChatBtn');
        const menuBtn = document.getElementById('menuBtn');
        const closePreview = document.getElementById('closePreview');
        const contactSearch = document.getElementById('contactSearch');
        const logoutBtn = document.getElementById('logoutBtn');
        const settingsLogout = document.getElementById('settingsLogout');
        const newContactBtn = document.getElementById('newContactBtn');
        const backToChats = document.getElementById('backToChats');
        const menuSettingsBtn = document.getElementById('menuSettingsBtn');

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.renderNewChatView());
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => this.toggleContextMenu(e));
        }

        if (closePreview) {
            closePreview.addEventListener('click', () => this.renderChatsView());
        }

        if (contactSearch) {
            contactSearch.addEventListener('input', (e) => this.filterContacts(e.target.value));
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

        if (backToChats) {
            backToChats.addEventListener('click', () => this.renderChatsView());
        }

        if (menuSettingsBtn) {
            menuSettingsBtn.addEventListener('click', () => this.renderSettingsView());
        }
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
                this.renderChatsView();
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
        const modalClose = document.getElementById('modal-close');
        const confirmOk = document.getElementById('confirm-ok');
        const confirmCancel = document.getElementById('confirm-cancel');
        const newContactSave = document.getElementById('newContactSave');
        const newContactCancel = document.getElementById('newContactCancel');

        if (sidebarChatIcon) {
            sidebarChatIcon.addEventListener('click', () => this.renderChatsView());
        }

        if (settingsIcon) {
            settingsIcon.addEventListener('click', () => this.renderSettingsView());
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

        if (newContactSave) {
            newContactSave.addEventListener('click', () => this.saveNewContact());
        }

        if (newContactCancel) {
            newContactCancel.addEventListener('click', () => this.hideModal('new-contact-modal'));
        }

        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            const menuBtn = document.getElementById('menuBtn');
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
        const attachBtn = document.getElementById('attachBtn');
        const audioInput = document.getElementById('audioInput');
        const cancelRecording = document.getElementById('cancelRecording');

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
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                window.location.href = 'chat.html';
            });
        }
        if (recordBtn) {
            recordBtn.addEventListener('mousedown', () => this.startRecording());
            recordBtn.addEventListener('mouseup', () => this.stopRecording());
            recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.startRecording(); });
            recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.stopRecording(); });
        }

        if (attachBtn) {
            attachBtn.addEventListener('click', () => audioInput.click());
        }

        if (audioInput) {
            audioInput.addEventListener('change', (e) => this.handleAudioUpload(e.target.files[0]));
        }

        if (cancelRecording) {
            cancelRecording.addEventListener('click', () => this.cancelRecording());
        }

        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.play-btn');
                if (playBtn) {
                    this.messageManager.playAudioMessage(playBtn.dataset.messageId);
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
                const audioData = await this.blobToBase64(audioBlob);
                const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

                const messageData = {
                    id: Date.now().toString(),
                    chatId: this.currentChatId,
                    sender: 'me',
                    type: 'voice',
                    audioData: audioData,
                    audioDuration: duration,
                    timestamp: new Date().toISOString(),
                    status: 'sending'
                };

                this.addMessageToInterface(messageData);

                try {
                    await ApiManager.saveMessage(messageData);
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
            this.showToast('Erreur lors de l\'accès au microphone', 'error');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        clearInterval(this.recordingTimer);
        this.isRecording = false;
    }

    cancelRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        clearInterval(this.recordingTimer);
        this.isRecording = false;
        this.audioChunks = [];
        const recordingIndicator = document.getElementById('recordingIndicator');
        const recordingTime = document.getElementById('recordingTime');
        if (recordingIndicator) recordingIndicator.classList.add('hidden');
        if (recordingTime) {
            recordingTime.textContent = '0:00';
            recordingTime.dataset.seconds = '0';
        }
        this.showToast('Enregistrement annulé', 'info');
    }

    async handleAudioUpload(file) {
        if (!file || !this.currentChatId) return;

        try {
            const audioData = await this.blobToBase64(file);
            const audio = new Audio(URL.createObjectURL(file));
            await new Promise((resolve) => {
                audio.onloadedmetadata = () => resolve();
            });
            const duration = Math.floor(audio.duration);

            const messageData = {
                id: Date.now().toString(),
                chatId: this.currentChatId,
                sender: 'me',
                type: 'audio',
                audioData: audioData,
                audioDuration: duration,
                timestamp: new Date().toISOString(),
                status: 'sending'
            };

            this.addMessageToInterface(messageData);

            await ApiManager.saveMessage(messageData);
            this.updateMessageStatus(messageData.id, 'sent');
            setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
            setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
        } catch (error) {
            console.error('Erreur upload audio:', error);
            this.showToast('Erreur lors de l\'envoi du fichier audio', 'error');
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    startPolling() {
        this.stopPolling();
        this.pollingInterval = setInterval(async () => {
            try {
                const messages = await ApiManager.getMessages(this.currentChatId);
                this.renderMessages(messages);
            } catch (error) {
                console.error('Erreur polling:', error);
            }
        }, 5000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    showDefaultView() {
        const chatHeader = document.getElementById('chatHeader');
        const messagesContainer = document.getElementById('messagesContainer');
        if (chatHeader) chatHeader.innerHTML = '';
        if (messagesContainer) messagesContainer.innerHTML = `
            <div class="flex-1 flex items-center justify-center text-gray-400">
                <p>Sélectionnez une discussion pour commencer</p>
            </div>
        `;
    }

    toggleContextMenu(event) {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        contextMenu.classList.toggle('hidden');
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.left = `${event.clientX}px`;

        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    }

    showModal(message, type = 'info') {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modal-message');
        const modalIcon = document.getElementById('modal-icon');

        if (modal && modalMessage && modalIcon) {
            modalMessage.textContent = message;
            modalIcon.innerHTML = type === 'error' ? '<i class="fas fa-exclamation-circle text-red-500"></i>' : '<i class="fas fa-info-circle text-green-500"></i>';
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        this.confirmCallback = null;
    }

    showConfirmModal(title, message, callback) {
        const modal = document.getElementById('confirm-modal');
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMessage = document.getElementById('confirm-message');

        if (modal && confirmTitle && confirmMessage) {
            confirmTitle.textContent = title;
            confirmMessage.textContent = message;
            modal.classList.remove('hidden');
            this.confirmCallback = callback;
        }
    }

    handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideModal('confirm-modal');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `flex items-center p-3 rounded-lg shadow-lg animate-slide-up max-w-xs ${
            type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-gray-700'
        } text-white`;

        toast.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-slide-down');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async logout() {
        try {
            await ApiManager.deleteSession();
            window.location.reload();
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            this.showToast('Erreur lors de la déconnexion', 'error');
        }
    }

    showNewContactModal() {
        const modal = document.getElementById('new-contact-modal');
        if (modal) modal.classList.remove('hidden');
    }

    async saveNewContact() {
        const nameInput = document.getElementById('newContactName');
        const phoneInput = document.getElementById('newContactPhone');

        if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
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
            this.contacts.push(contactData);
            if (this.currentView === 'chats') {
                this.renderContactsList(this.contacts);
            } else if (this.currentView === 'newChat') {
                this.renderNewChatContactsList(this.contacts);
            }
            this.hideModal('new-contact-modal');
            nameInput.value = '';
            phoneInput.value = '';
            this.showToast('Contact ajouté avec succès', 'success');
        } catch (error) {
            console.error('Erreur ajout contact:', error);
            this.showToast('Erreur lors de l\'ajout du contact', 'error');
        }
    }

    filterContacts(query) {
        const filtered = this.contacts.filter(contact =>
            (contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`).toLowerCase().includes(query.toLowerCase()) ||
            contact.phone.includes(query)
        );

        if (this.currentView === 'chats') {
            this.renderContactsList(filtered);
        } else if (this.currentView === 'newChat') {
            this.renderNewChatContactsList(filtered);
        }
    }
}

// Initialisation
const chatSystem = new ChatSystem();