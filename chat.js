const API_BASE_URL = 'https://projet-json-server-7.onrender.com';

async function apiRequest(endpoint, options = {}) {
    try {
        const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { ...options.headers, ...headers },
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

async function saveContact(contactData) {
    return await apiRequest('/contacts', { method: 'POST', body: JSON.stringify(contactData) });
}

async function getContacts() {
    return await apiRequest('/contacts');
}

async function saveMessage(messageData) {
    return await apiRequest('/messages', { method: 'POST', body: JSON.stringify(messageData) });
}

async function getMessages(chatId = null) {
    const endpoint = chatId ? `/messages?chatId=${chatId}` : '/messages';
    return await apiRequest(endpoint);
}

async function saveVoiceMessage(chatId, metadata) {
    const voiceMessageData = {
        id: Date.now().toString(),
        chatId,
        duration: metadata.duration || 10,
        timestamp: new Date().toISOString(),
        audioUrl: `https://example.com/voice-messages/${Date.now()}.webm`
    };
    return await apiRequest('/voice-messages', {
        method: 'POST',
        body: JSON.stringify(voiceMessageData)
    });
}

class ModalSystem {
    constructor() {
        this.modal = document.getElementById('modal');
        this.confirmModal = document.getElementById('confirm-modal');
        this.loadingModal = document.getElementById('loading-modal');
        this.tempPreview = document.getElementById('tempPreview');
        this.currentView = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('modal-close')?.addEventListener('click', () => this.hideModal());
        document.getElementById('confirm-cancel')?.addEventListener('click', () => this.hideConfirmModal());
        [this.modal, this.confirmModal, this.loadingModal].forEach(modal => {
            modal?.addEventListener('click', (e) => e.target === modal && this.hideAllModals());
        });
        document.addEventListener('keydown', (e) => e.key === 'Escape' && this.hideAllModals());
    }

    showModal(message, type = 'info') {
        const messageEl = document.getElementById('modal-message');
        const iconEl = document.getElementById('modal-icon');
        if (!messageEl || !iconEl) return;
        messageEl.textContent = message;
        const icons = {
            success: '<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><i class="fas fa-check text-white text-xl"></i></div>',
            error: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><i class="fas fa-times text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            info: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><i class="fas fa-info text-white text-xl"></i></div>'
        };
        iconEl.innerHTML = icons[type] || icons.info;
        this.modal.classList.remove('hidden');
        this.modal.classList.add('animate-fade-in');
        if (type === 'success') setTimeout(() => this.hideModal(), 3000);
    }

    hideModal() {
        this.modal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showConfirmModal(title, message, onConfirm, type = 'warning') {
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const confirmBtn = document.getElementById('confirm-ok');
        if (!titleEl || !messageEl || !iconEl || !confirmBtn) return;
        titleEl.textContent = title;
        messageEl.textContent = message;
        const icons = {
            danger: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation-triangle text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            question: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><i class="fas fa-question text-white text-xl"></i></div>'
        };
        iconEl.innerHTML = icons[type] || icons.warning;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => { this.hideConfirmModal(); onConfirm && onConfirm(); });
        this.confirmModal.classList.remove('hidden');
        this.confirmModal.classList.add('animate-fade-in');
    }

    hideConfirmModal() {
        this.confirmModal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.confirmModal.classList.add('hidden');
            this.confirmModal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showLoadingModal(message = 'Chargement...') {
        const messageEl = document.getElementById('loading-message');
        if (!messageEl) return;
        messageEl.textContent = message;
        this.loadingModal.classList.remove('hidden');
        this.loadingModal.classList.add('animate-scale-in');
    }

    hideLoadingModal() {
        this.loadingModal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.loadingModal.classList.add('hidden');
            this.loadingModal.classList.remove('animate-scale-in', 'animate-fade-out');
        }, 200);
    }

    hideAllModals() {
        this.hideModal();
        this.hideConfirmModal();
        this.hideLoadingModal();
        this.hideNewContactFormInPreview();
        this.hideNewChatInPreview();
        this.hideSettingsInPreview();
    }

    showNewContactFormInPreview() {
        this.currentView = 'newContact';
        const newContactHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col p-4 animate-slide-up">
                <div class="flex items-center mb-4">
                    <button id="newContactBack" class="text-gray-400 hover:text-white text-2xl mr-4">←</button>
                    <h2 class="text-white text-lg font-semibold">Nouveau contact</h2>
                </div>
                <div class="flex-1 space-y-4 overflow-y-auto">
                    <input type="text" id="contactFirstName" placeholder="Prénom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none placeholder-gray-400">
                    <input type="text" id="contactLastName" placeholder="Nom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none">
                    <div class="flex items-center">
                        <select id="contactCountryCode" class="w-24 p-2 bg-gray-800 rounded-l-lg focus:outline-none">
                            <option value="+221">SN +221</option>
                            <option value="+33">FR +33</option>
                            <option value="+1">US +1</option>
                            <option value="+44">UK +44</option>
                        </select>
                        <input type="tel" id="contactPhone" placeholder="Téléphone" class="flex-1 p-2 bg-gray-800 text-white rounded-r-lg focus:outline-none">
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="syncContact" class="w-5 h-5 text-green-500 bg-gray-800 rounded">
                        <label for="syncContact" class="text-gray-300 text-sm">Synchroniser le contact sur le téléphone</label>
                    </div>
                    <button id="saveContactBtn" class="w-full bg-green-600 text-white p-2 rounded-lg">Enregistrer</button>
                    <p class="text-gray-500 text-xs text-center">Ce contact sera ajouté au carnet d'adresses.</p>
                </div>
            </div>
        `;
        this.tempPreview.innerHTML = newContactHTML;
        this.tempPreview.style.display = 'flex';
        document.getElementById('newContactBack')?.addEventListener('click', () => {
            if (this.currentView === 'newContact') {
                this.hideNewContactFormInPreview();
                this.showNewChatInPreview();
            }
        });
        document.getElementById('saveContactBtn')?.addEventListener('click', async () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim().replace(/\s/g, '');
            const sync = document.getElementById('syncContact').checked;
            if (!firstName || !lastName || !phone) {
                this.showModal('Veuillez remplir tous les champs.', 'warning');
                return;
            }
            const phoneRegex = /^[\+]?[0-9]+$/;
            if (!phoneRegex.test(phone)) {
                this.showModal('Numéro de téléphone invalide.', 'warning');
                return;
            }
            const contactData = {
                id: Date.now().toString(),
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                phone,
                country: phone.slice(1, 4),
                avatar: { color: 'bg-green-500', initial: firstName.charAt(0).toUpperCase() },
                createdAt: new Date().toISOString()
            };
            this.showLoadingModal('Ajout de contact...');
            try {
                await saveContact(contactData);
                this.hideLoadingModal();
                this.showModal('Contact ajouté avec succès !', 'success');
                this.hideNewContactFormInPreview();
                this.showNewChatInPreview();
                await window.WhatsAppSystems?.chatSystem?.updateContactsList();
            } catch (error) {
                this.hideLoadingModal();
                this.showModal('Erreur lors de l\'ajout du contact.', 'error');
            }
        });
    }

    hideNewContactFormInPreview() {
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }

    showSettingsInPreview() {
        this.currentView = 'settings';
        const settingsHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col animate-slide-up">
                <div class="flex justify-center pt-8 pb-4 bg-gray-900 border-b border-gray-800">
                    <input type="text" placeholder="Rechercher dans les paramètres" class="w-3/4 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none">
                </div>
                <div class="flex flex-col items-center py-6 border-b border-gray-800">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="avatar" class="w-24 h-24 rounded-full border-2 border-gray-700">
                    <p class="text-white font-bold mt-4">Bachir_deV</p>
                    <p class="text-gray-400 text-xs mt-2">Salut ! J'utilise WhatsApp.</p>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <ul>
                        <li><a href="#" class="block p-4">Compte</a></li>
                        <li><a href="#" class="block p-4">Confidentialité</a></li>
                        <li><a href="#" class="block p-4">Chats</a></li>
                        <li><a href="#" class="block p-4">Notifications</a></li>
                        <li><a href="#" class="block p-4">Aide</a></li>
                        <li><a href="#" id="settingsLogoutBtn" class="block p-4 text-red-500">Déconnexion</a></li>
                    </ul>
                </div>
            </div>
        `;
        this.tempPreview.innerHTML = settingsHTML;
        this.tempPreview.style.display = 'flex';
        document.getElementById('settingsLogoutBtn')?.addEventListener('click', () => {
            window.WhatsAppSystems?.chatSystem?.logout();
        });
    }

    hideSettingsInPreview() {
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }

    showNewChatInPreview() {
        this.currentView = 'newChat';
        this.showLoadingModal('Chargement des contacts...');
        getContacts().then(contacts => {
            this.hideLoadingModal();
            const newChatHTML = `
                <div class="h-full w-[600px] bg-gray-900 flex flex-col p-4 animate-slide-up">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-white text-lg">Nouvelle discussion</h2>
                        <button id="closePreviewBtn" class="text-gray-400 hover:text-white">×</button>
                    </div>
                    <div class="flex-1 overflow-y-auto">
                        <button id="newContactBtn" class="block p-2">Nouveau contact</button>
                        ${contacts.map(c => `<div class="p-2">${c.fullName}</div>`).join('')}
                    </div>
                </div>
            `;
            this.tempPreview.innerHTML = newChatHTML;
            this.tempPreview.style.display = 'flex';
            document.getElementById('closePreviewBtn')?.addEventListener('click', () => this.hideNewChatInPreview());
            document.getElementById('newContactBtn')?.addEventListener('click', () => this.showNewContactFormInPreview());
        }).catch(() => {
            this.hideLoadingModal();
            this.showModal('Erreur de chargement des contacts.', 'error');
        });
    }

    hideNewChatInPreview() {
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }
}

class ChatSystem {
    constructor(modalSystem) {
        this.modalSystem = modalSystem;
        this.currentChatId = null;
        this.currentContact = null;
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.callBtn = document.getElementById('callBtn');
        this.searchBtn = document.getElementById('searchBtn');
        this.optionsBtn = document.getElementById('optionsBtn');
        this.optionsMenu = document.getElementById('chatOptionsMenu');
        this.searchBarEl = document.getElementById('searchBar');
        this.searchInput = document.getElementById('searchInput');
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.setupEventListeners();
        this.loadContacts();
        this.pollMessages();
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.handleSendMessage());
        this.messageInput?.addEventListener('keypress', (e) => e.key === 'Enter' && this.handleSendMessage());
        this.recordBtn?.addEventListener('click', () => this.toggleRecording());
        this.callBtn?.addEventListener('click', () => this.modalSystem.showModal('Appel non implémenté.', 'info'));
        this.searchBtn?.addEventListener('click', () => this.toggleSearch());
        this.optionsBtn?.addEventListener('click', () => this.toggleOptionsMenu());
        this.searchInput?.addEventListener('input', () => this.handleSearch());
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.modalSystem.showNewChatInPreview());
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleContextMenu());
        document.getElementById('settingsIcon')?.addEventListener('click', () => this.modalSystem.showSettingsInPreview());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('settingsLogout')?.addEventListener('click', () => this.logout());
        document.addEventListener('click', (e) => {
            if (!this.optionsMenu.contains(e.target) && !this.optionsBtn.contains(e.target)) {
                this.optionsMenu.classList.add('hidden');
            }
            if (!document.getElementById('contextMenu').contains(e.target) && !document.getElementById('menuBtn').contains(e.target)) {
                this.hideContextMenu();
            }
        });
    }

    toggleSearch() {
        this.searchBarEl.classList.toggle('hidden');
        if (!this.searchBarEl.classList.contains('hidden')) {
            this.searchInput.focus();
        } else {
            this.searchInput.value = '';
            this.loadMessages();
        }
    }

    handleSearch() {
        const query = this.searchInput.value.toLowerCase();
        const messages = document.querySelectorAll('#messagesContainer > div');
        messages.forEach(msg => {
            const content = msg.querySelector('p')?.textContent.toLowerCase() || '';
            msg.style.display = content.includes(query) ? '' : 'none';
        });
    }

    toggleOptionsMenu() {
        this.optionsMenu.classList.toggle('hidden');
    }

    toggleContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.classList.toggle('hidden');
    }

    hideContextMenu() {
        document.getElementById('contextMenu').classList.add('hidden');
    }

    async updateContactsList() {
        await this.loadContacts();
    }

    async loadContacts() {
        try {
            const contacts = await getContacts();
            const contactsList = document.getElementById('contactsList');
            contactsList.innerHTML = contacts.map(contact => `
                <div class="contact-item p-3 hover:bg-gray-800 cursor-pointer flex items-center" data-contact-id="${contact.id}">
                    <div class="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        <span class="text-white">${contact.fullName.charAt(0)}</span>
                    </div>
                    <div>
                        <p class="text-white">${contact.fullName}</p>
                        <p class="text-gray-500 text-sm">${contact.phone}</p>
                    </div>
                </div>
            `).join('');
            contactsList.querySelectorAll('.contact-item').forEach(item => {
                item.addEventListener('click', () => this.selectContact(item.dataset.contactId));
            });
        } catch (error) {
            this.modalSystem.showModal('Erreur de chargement des contacts.', 'error');
        }
    }

    async selectContact(contactId) {
        this.currentChatId = contactId;
        const contacts = await getContacts();
        this.currentContact = contacts.find(c => c.id === contactId);
        document.getElementById('chatContactName').textContent = this.currentContact?.fullName || 'Contact';
        await this.loadMessages();
        this.scrollToBottom();
    }

    async loadMessages() {
        try {
            const messages = await getMessages(this.currentChatId);
            this.messagesContainer.innerHTML = messages.map(msg => {
                const isMe = msg.senderId === 'user_id';
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return msg.type === 'text' ? `
                    <div class="mb-2 p-2 ${isMe ? 'message-sent' : 'message-received'}">
                        <p>${msg.content}</p>
                        <span class="timestamp">${time}</span>
                    </div>
                ` : `
                    <div class="mb-2 p-2 ${isMe ? 'voice-message' : 'message-received'}">
                        <audio controls src="${msg.audioUrl}" class="w-full"></audio>
                        <span class="timestamp">${time}</span>
                    </div>
                `;
            }).join('');
            this.scrollToBottom();
        } catch (error) {
            this.modalSystem.showModal('Erreur de chargement des messages.', 'error');
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async handleSendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.currentChatId) return;
        const messageData = {
            id: Date.now().toString(),
            chatId: this.currentChatId,
            senderId: 'user_id',
            content,
            type: 'text',
            timestamp: new Date().toISOString()
        };
        try {
            await saveMessage(messageData);
            this.messageInput.value = '';
            await this.loadMessages();
        } catch (error) {
            this.modalSystem.showModal('Erreur lors de l\'envoi du message.', 'error');
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
                this.mediaRecorder.onstop = () => this.handleStopRecording();
                this.mediaRecorder.start();
                this.isRecording = true;
                this.recordBtn.classList.add('bg-red-800');
                this.recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                this.modalSystem.showModal('Enregistrement en cours...', 'info');
            } catch (error) {
                this.modalSystem.showModal('Erreur d\'accès au microphone.', 'error');
            }
        } else {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordBtn.classList.remove('bg-red-800');
            this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            this.modalSystem.hideModal();
        }
    }

    async handleStopRecording() {
        if (!this.currentChatId) return;
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = this.audioChunks.reduce((acc, chunk) => acc + (chunk.size / 1000), 0);
        try {
            await saveVoiceMessage(this.currentChatId, { duration });
            await this.loadMessages();
        } catch (error) {
            this.modalSystem.showModal('Erreur lors de l\'envoi du message vocal.', 'error');
        }
    }

    pollMessages() {
        setInterval(async () => {
            if (this.currentChatId) {
                try {
                    await this.loadMessages();
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }
        }, 5000);
    }

    logout() {
        this.modalSystem.showConfirmModal(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            () => {
                this.modalSystem.showModal('Déconnexion réussie.', 'success');
                this.currentChatId = null;
                this.currentContact = null;
                this.messagesContainer.innerHTML = '';
            },
            'question'
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modalSystem = new ModalSystem();
    window.WhatsAppSystems = {
        modalSystem,
        chatSystem: new ChatSystem(modalSystem)
    };
});