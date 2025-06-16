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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async getContacts() {
        return await this.request('/contacts');
    }

    static async saveContact(contactData) {
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

    static async deleteMessage(messageId) {
        return await this.request(`/messages/${messageId}`, {
            method: 'DELETE'
        });
    }
}

// Système de gestion des emojis
class EmojiManager {
    constructor() {
        this.emojis = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
            gestures: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'],
            hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🥍', '🏏', '⛳', '🪃', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️']
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

        // Créer les onglets de catégories
        const categories = document.createElement('div');
        categories.className = 'flex gap-2 mb-3 border-b border-gray-600 pb-2';
        
        Object.keys(this.emojis).forEach(category => {
            const tab = document.createElement('button');
            tab.className = `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                category === this.currentCategory 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
        
        // Mettre à jour les onglets
        const tabs = document.querySelectorAll('#emojiPicker button');
        tabs.forEach((tab, index) => {
            const categories = Object.keys(this.emojis);
            if (categories[index] === category) {
                tab.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-green-600 text-white transition-colors';
            } else {
                tab.className = 'px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors';
            }
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
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            messageInput.value = textBefore + emoji + textAfter;
            messageInput.focus();
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
            
            // Déclencher l'événement input pour mettre à jour le compteur
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
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    setupEventListeners() {
        // Fermer le picker en cliquant à l'extérieur
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
        this.typingTimeout = null;
        this.isTyping = false;
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Aujourd'hui";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Hier";
        } else {
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    getMessageStatusIcon(status) {
        switch (status) {
            case 'sending':
                return '<i class="fas fa-clock text-gray-400 text-xs"></i>';
            case 'sent':
                return '<i class="fas fa-check text-gray-400 text-xs"></i>';
            case 'delivered':
                return '<i class="fas fa-check-double text-gray-400 text-xs"></i>';
            case 'read':
                return '<i class="fas fa-check-double text-blue-400 text-xs"></i>';
            default:
                return '';
        }
    }

    createMessageElement(message, showDate = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-group mb-4';
        messageDiv.dataset.messageId = message.id;

        let html = '';

        // Séparateur de date
        if (showDate) {
            html += `
                <div class="date-separator">
                    <span>${this.formatDate(message.timestamp)}</span>
                </div>
            `;
        }

        // Message bubble
        const isOwn = message.sender === 'me';
        const bubbleClass = isOwn ? 'own' : 'other';
        
        html += `
            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2">
                <div class="message-bubble ${bubbleClass} p-3 relative group">
                    ${this.renderMessageContent(message)}
                    
                    <div class="message-time">
                        ${this.formatTime(message.timestamp)}
                        ${isOwn ? `<span class="message-status">${this.getMessageStatusIcon(message.status)}</span>` : ''}
                    </div>

                    <!-- Menu contextuel -->
                    <div class="message-menu">
                        <button onclick="messageManager.replyToMessage('${message.id}')" class="p-2 text-gray-400 hover:text-white rounded" title="Répondre">
                            <i class="fas fa-reply text-sm"></i>
                        </button>
                        <button onclick="messageManager.showQuickReactions('${message.id}')" class="p-2 text-gray-400 hover:text-white rounded" title="Réagir">
                            <i class="fas fa-smile text-sm"></i>
                        </button>
                        <button onclick="messageManager.showMessageOptions('${message.id}')" class="p-2 text-gray-400 hover:text-white rounded" title="Plus">
                            <i class="fas fa-ellipsis-v text-sm"></i>
                        </button>
                    </div>

                    <!-- Réactions rapides -->
                    <div class="quick-reactions">
                        <button onclick="messageManager.addReaction('${message.id}', '👍')" class="text-lg hover:scale-110 transition-transform">👍</button>
                        <button onclick="messageManager.addReaction('${message.id}', '❤️')" class="text-lg hover:scale-110 transition-transform">❤️</button>
                        <button onclick="messageManager.addReaction('${message.id}', '😂')" class="text-lg hover:scale-110 transition-transform">😂</button>
                        <button onclick="messageManager.addReaction('${message.id}', '😮')" class="text-lg hover:scale-110 transition-transform">😮</button>
                        <button onclick="messageManager.addReaction('${message.id}', '😢')" class="text-lg hover:scale-110 transition-transform">😢</button>
                        <button onclick="messageManager.addReaction('${message.id}', '🙏')" class="text-lg hover:scale-110 transition-transform">🙏</button>
                    </div>

                    <!-- Réactions existantes -->
                    ${this.renderReactions(message.reactions)}
                </div>
            </div>
        `;

        messageDiv.innerHTML = html;
        return messageDiv;
    }

    renderMessageContent(message) {
        switch (message.type) {
            case 'text':
                return `<div class="break-words">${this.formatMessageText(message.content)}</div>`;
            
            case 'voice':
                return this.renderVoiceMessage(message);
            
            case 'image':
                return `
                    <div class="max-w-xs">
                        <img src="${message.imageUrl}" alt="Image" class="rounded-lg max-w-full h-auto">
                        ${message.content ? `<div class="mt-2 break-words">${this.formatMessageText(message.content)}</div>` : ''}
                    </div>
                `;
            
            default:
                return `<div class="break-words">${message.content || 'Message non supporté'}</div>`;
        }
    }

    renderVoiceMessage(message) {
        const duration = message.audioDuration || 15;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        return `
            <div class="voice-message">
                <button class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors" onclick="messageManager.playVoiceMessage('${message.id}')">
                    <i class="fas fa-play text-sm"></i>
                </button>
                <div class="voice-waveform">
                    ${this.generateWaveform()}
                </div>
                <span class="text-xs text-gray-600">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            </div>
        `;
    }

    generateWaveform() {
        let waveform = '';
        for (let i = 0; i < 20; i++) {
            const height = Math.random() * 20 + 8;
            waveform += `<div class="wave-bar" style="height: ${height}px;"></div>`;
        }
        return waveform;
    }

    renderReactions(reactions) {
        if (!reactions || reactions.length === 0) return '';

        const reactionCounts = {};
        reactions.forEach(reaction => {
            reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
        });

        let reactionsHtml = '<div class="message-reactions">';
        Object.entries(reactionCounts).forEach(([emoji, count]) => {
            reactionsHtml += `
                <div class="reaction">
                    <span>${emoji}</span>
                    <span>${count}</span>
                </div>
            `;
        });
        reactionsHtml += '</div>';

        return reactionsHtml;
    }

    formatMessageText(text) {
        // Formatage basique du texte (liens, mentions, etc.)
        return text
            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>') // Gras
            .replace(/_([^_]+)_/g, '<em>$1</em>') // Italique
            .replace(/~([^~]+)~/g, '<del>$1</del>') // Barré
            .replace(/```([^`]+)```/g, '<code class="bg-gray-200 px-1 rounded">$1</code>'); // Code
    }

    addReaction(messageId, emoji) {
        console.log(`Ajout de la réaction ${emoji} au message ${messageId}`);
        // Ici, vous pouvez implémenter la logique pour sauvegarder la réaction
        // et mettre à jour l'affichage
    }

    replyToMessage(messageId) {
        console.log(`Répondre au message ${messageId}`);
        // Implémenter la logique de réponse
    }

    showQuickReactions(messageId) {
        console.log(`Afficher les réactions rapides pour ${messageId}`);
    }

    showMessageOptions(messageId) {
        console.log(`Afficher les options pour ${messageId}`);
    }

    playVoiceMessage(messageId) {
        console.log(`Lire le message vocal ${messageId}`);
        // Implémenter la lecture audio
    }

    showTypingIndicator(contactName) {
        const chatHeader = document.querySelector('#chatArea .bg-gray-900');
        if (!chatHeader) return;

        const statusElement = chatHeader.querySelector('.text-gray-400');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="flex items-center gap-2">
                    <span>en train d'écrire</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
            statusElement.classList.add('text-green-400');
            statusElement.classList.remove('text-gray-400');
        }
    }

    hideTypingIndicator() {
        const chatHeader = document.querySelector('#chatArea .bg-gray-900');
        if (!chatHeader) return;

        const statusElement = chatHeader.querySelector('.text-green-400');
        if (statusElement) {
            statusElement.textContent = 'en ligne';
            statusElement.classList.remove('text-green-400');
            statusElement.classList.add('text-gray-400');
        }
    }

    startTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            // Envoyer l'indicateur de frappe au serveur
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    stopTyping() {
        if (this.isTyping) {
            this.isTyping = false;
            clearTimeout(this.typingTimeout);
            // Arrêter l'indicateur de frappe sur le serveur
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
            console.error('Erreur lors du chargement des contacts:', error);
        }
    }

    renderContactsList(contacts) {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        contactsList.innerHTML = contacts.map(contact => {
            const avatar = contact.avatar || { 
                color: 'bg-green-500', 
                initial: (contact.firstName?.charAt(0) || 'A').toUpperCase() 
            };
            const unreadCount = Math.floor(Math.random() * 10);
            const lastMessage = this.getLastMessage(contact.id);
            
            return `
                <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer transition-colors duration-200 group" 
                     data-contact-id="${contact.id}" 
                     onclick="chatSystem.selectContact('${contact.id}')">
                    <div class="relative">
                        <div class="${avatar.color} w-12 h-12 rounded-full flex items-center justify-center">
                            ${avatar.url ? 
                                `<img src="${avatar.url}" alt="${contact.fullName}" class="w-full h-full rounded-full object-cover">` :
                                `<span class="text-white font-bold text-lg">${avatar.initial}</span>`
                            }
                        </div>
                        ${contact.status === 'online' ? 
                            '<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>' : 
                            ''
                        }
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-semibold truncate group-hover:text-green-400 transition-colors">
                                ${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}
                            </span>
                            <span class="text-gray-500 text-xs">
                                ${lastMessage ? this.messageManager.formatTime(lastMessage.timestamp) : ''}
                            </span>
                        </div>
                        
                        <div class="flex justify-between items-center mt-1">
                            <div class="text-gray-400 text-sm truncate">
                                ${contact.isTyping ? 
                                    '<span class="text-green-400 italic">en train d\'écrire...</span>' :
                                    (lastMessage ? lastMessage.content : contact.phone)
                                }
                            </div>
                            
                            ${unreadCount > 0 ? 
                                `<div class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    ${unreadCount}
                                </div>` : 
                                ''
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getLastMessage(contactId) {
        // Simuler le dernier message pour la démo
        return {
            content: "Dernier message...",
            timestamp: new Date().toISOString()
        };
    }

    async selectContact(contactId) {
        try {
            const contacts = await ApiManager.getContacts();
            this.currentContact = contacts.find(c => c.id === contactId);
            this.currentChatId = contactId;
            
            if (this.currentContact) {
                this.renderChatInterface();
                await this.loadMessages();
            }
        } catch (error) {
            console.error('Erreur lors de la sélection du contact:', error);
        }
    }

    renderChatInterface() {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea || !this.currentContact) return;

        const avatar = this.currentContact.avatar || { 
            color: 'bg-green-500', 
            initial: (this.currentContact.firstName?.charAt(0) || 'A').toUpperCase() 
        };

        chatArea.innerHTML = `
            <!-- En-tête du chat -->
            <div class="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="${avatar.color} w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center">
                            ${avatar.url ? 
                                `<img src="${avatar.url}" alt="${this.currentContact.fullName}" class="w-full h-full rounded-full object-cover">` :
                                `<span class="text-white font-bold">${avatar.initial}</span>`
                            }
                        </div>
                        ${this.currentContact.status === 'online' ? 
                            '<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>' : 
                            ''
                        }
                    </div>

                    <div>
                        <h2 class="text-white font-semibold text-lg">
                            ${this.currentContact.fullName || `${this.currentContact.firstName || ''} ${this.currentContact.lastName || ''}`}
                        </h2>
                        <p class="text-gray-400 text-sm">
                            ${this.currentContact.status === 'online' ? 'en ligne' : 'hors ligne'}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Appel vidéo">
                        <i class="fas fa-video text-xl"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Appel vocal">
                        <i class="fas fa-phone text-xl"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Rechercher">
                        <i class="fas fa-search text-xl"></i>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Menu">
                        <i class="fas fa-ellipsis-v text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Zone des messages -->
            <div class="flex-1 overflow-y-auto scrollbar-thin p-4" id="messagesContainer">
                <!-- Les messages seront chargés ici -->
            </div>

            <!-- Zone de saisie -->
            <div class="bg-gray-900 p-4 border-t border-gray-700">
                <div class="flex items-center gap-3">
                    <button id="emojiBtn" class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Emoji">
                        <i class="far fa-smile text-xl"></i>
                    </button>
                    
                    <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" title="Pièce jointe">
                        <i class="fas fa-paperclip text-xl"></i>
                    </button>

                    <div class="flex-1 relative">
                        <input 
                            type="text" 
                            id="messageInput" 
                            placeholder="Tapez un message..." 
                            class="w-full bg-gray-800 text-gray-200 placeholder-gray-500 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                        />
                        <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            <span id="charCount">0</span>/4096
                        </div>
                    </div>

                    <button id="sendBtn" class="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors hidden" title="Envoyer">
                        <i class="fas fa-paper-plane text-xl"></i>
                    </button>

                    <button id="recordBtn" class="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors" title="Message vocal">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                </div>
                
                <div id="recordingIndicator" class="hidden text-red-400 text-sm mt-2 flex items-center gap-2">
                    <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span>Enregistrement en cours...</span>
                    <span id="recordingTime">0:00</span>
                </div>
            </div>
        `;

        this.setupChatEventListeners();
    }

    setupEventListeners() {
        // Événements globaux
        document.addEventListener('click', (e) => {
            // Fermer l'emoji picker si on clique ailleurs
            if (!e.target.closest('#emojiPicker') && !e.target.closest('#emojiBtn')) {
                this.emojiManager.hide();
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
                const length = e.target.value.length;
                charCount.textContent = length;
                
                if (length > 0) {
                    sendBtn.classList.remove('hidden');
                    recordBtn.classList.add('hidden');
                } else {
                    sendBtn.classList.add('hidden');
                    recordBtn.classList.remove('hidden');
                }

                // Indicateur de frappe
                this.messageManager.startTyping();
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (recordBtn) {
            recordBtn.addEventListener('mousedown', () => this.startRecording());
            recordBtn.addEventListener('mouseup', () => this.stopRecording());
            recordBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startRecording();
            });
            recordBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopRecording();
            });
        }

        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.emojiManager.toggle());
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

        // Ajouter le message à l'interface immédiatement
        this.addMessageToInterface(messageData);
        
        // Vider le champ de saisie
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('sendBtn').classList.add('hidden');
        document.getElementById('recordBtn').classList.remove('hidden');

        // Arrêter l'indicateur de frappe
        this.messageManager.stopTyping();

        try {
            // Sauvegarder le message
            const savedMessage = await ApiManager.saveMessage(messageData);
            
            // Mettre à jour le statut du message
            this.updateMessageStatus(messageData.id, 'sent');
            
            // Simuler la livraison et la lecture
            setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
            setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            this.updateMessageStatus(messageData.id, 'failed');
        }
    }

    addMessageToInterface(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        // Vérifier s'il faut afficher un séparateur de date
        const lastMessage = messagesContainer.lastElementChild;
        let showDate = true;
        
        if (lastMessage) {
            const lastMessageDate = new Date(lastMessage.dataset.timestamp || 0);
            const currentMessageDate = new Date(message.timestamp);
            showDate = !this.isSameDay(lastMessageDate, currentMessageDate);
        }

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

            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="text-center text-gray-500 text-sm py-8">
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Vous êtes maintenant connecté avec ${this.currentContact.fullName}</span>
                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <p class="text-xs">Les messages sont chiffrés de bout en bout</p>
                    </div>
                `;
            } else {
                messagesContainer.innerHTML = '';
                
                messages.forEach((message, index) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showDate = !prevMessage || !this.isSameDay(new Date(prevMessage.timestamp), new Date(message.timestamp));
                    
                    const messageElement = this.messageManager.createMessageElement(message, showDate);
                    messageElement.dataset.timestamp = message.timestamp;
                    messagesContainer.appendChild(messageElement);
                });
            }
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.isRecording = true;
            this.mediaRecorder.start();
            
            // Afficher l'indicateur d'enregistrement
            const indicator = document.getElementById('recordingIndicator');
            const recordBtn = document.getElementById('recordBtn');
            
            if (indicator) indicator.classList.remove('hidden');
            if (recordBtn) {
                recordBtn.classList.remove('bg-gray-700');
                recordBtn.classList.add('bg-red-600');
            }

            // Démarrer le chronomètre
            this.startRecordingTimer();

        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.isRecording = false;
        this.mediaRecorder.stop();
        
        // Masquer l'indicateur d'enregistrement
        const indicator = document.getElementById('recordingIndicator');
        const recordBtn = document.getElementById('recordBtn');
        
        if (indicator) indicator.classList.add('hidden');
        if (recordBtn) {
            recordBtn.classList.add('bg-gray-700');
            recordBtn.classList.remove('bg-red-600');
        }

        this.stopRecordingTimer();
    }

    startRecordingTimer() {
        let seconds = 0;
        this.recordingTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeElement = document.getElementById('recordingTime');
            if (timeElement) {
                timeElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    async sendVoiceMessage(audioBlob) {
        const messageData = {
            id: Date.now().toString(),
            chatId: this.currentChatId,
            sender: 'me',
            type: 'voice',
            timestamp: new Date().toISOString(),
            status: 'sending',
            audioDuration: 15 // Durée simulée
        };

        this.addMessageToInterface(messageData);

        try {
            // Ici, vous pourriez uploader le fichier audio
            // const savedMessage = await ApiManager.saveVoiceMessage(this.currentChatId, audioBlob);
            
            // Pour la démo, on simule juste la sauvegarde
            setTimeout(() => {
                this.updateMessageStatus(messageData.id, 'sent');
                setTimeout(() => this.updateMessageStatus(messageData.id, 'delivered'), 1000);
                setTimeout(() => this.updateMessageStatus(messageData.id, 'read'), 2000);
            }, 500);
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message vocal:', error);
            this.updateMessageStatus(messageData.id, 'failed');
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    showDefaultView() {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;

        chatArea.innerHTML = `
            <div class="flex-1 bg-gray-800 flex items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="mb-8 relative">
                        <div class="relative mx-auto w-80 h-60">
                            <svg class="absolute left-0 top-8 z-0" width="320" height="120" viewBox="0 0 320 120" fill="none">
                                <ellipse cx="160" cy="60" rx="140" ry="55" fill="#23272b"/>
                            </svg>
                            
                            <div class="absolute left-4 top-16 w-20 h-32 rounded-xl border-2 border-teal-200 bg-gray-900 shadow-lg z-20 transform -rotate-12">
                                <div class="w-full h-full flex flex-col items-center justify-center">
                                    <div class="w-3 h-3 rounded-full border-2 border-gray-700 mt-2 mb-2"></div>
                                    <div class="flex flex-col items-center mt-2">
                                        <div class="flex space-x-0.5 mb-1">
                                            <div class="w-1 h-2 bg-gray-500 rounded"></div>
                                            <div class="w-1 h-3 bg-gray-500 rounded"></div>
                                            <div class="w-1 h-4 bg-gray-500 rounded"></div>
                                            <div class="w-1 h-5 bg-gray-500 rounded"></div>
                                        </div>
                                        <span class="text-red-400 text-lg font-bold -mt-2">×</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="absolute right-2 top-10 w-40 h-28 z-20 transform rotate-3">
                                <div class="w-40 h-20 bg-gray-100 rounded-t-lg border-2 border-teal-200 flex items-center justify-center">
                                    <div class="w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center">
                                        <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                                            <circle cx="14" cy="14" r="14" fill="#34d399"/>
                                            <path d="M8 15.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div class="w-44 h-3 bg-teal-200 rounded-b-lg -mt-1 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    
                    <h2 class="text-2xl font-light text-white mb-4">WhatsApp Web</h2>
                    <p class="text-gray-300 text-sm leading-relaxed mb-2">
                        Envoyez et recevez des messages sans avoir à garder votre téléphone connecté.
                    </p>
                    <p class="text-gray-300 text-sm leading-relaxed">
                        Utilisez WhatsApp sur un maximum de 4 appareils et 1 téléphone, simultanément.
                    </p>
                    
                    <div class="flex items-center justify-center mt-8 text-gray-400 text-xs">
                        <i class="fas fa-lock mr-2"></i>
                        <span>Vos messages personnels sont chiffrés de bout en bout</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Variables globales
let chatSystem;
let messageManager;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new ChatSystem();
    messageManager = chatSystem.messageManager;
});