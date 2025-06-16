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
        this.previewPanel = document.getElementById('previewPanel');
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
        window.WhatsAppSystems.navigationSystem.hidePreview();
    }
}

class NavigationSystem {
    constructor(modalSystem, chatSystem) {
        this.modalSystem = modalSystem;
        this.chatSystem = chatSystem;
        this.views = {
            sidebarChats: document.getElementById('sidebarChats'),
            chatArea: document.getElementById('chatArea'),
            sidebarSettings: document.getElementById('sidebarSettings'),
            previewPanel: document.getElementById('previewPanel')
        };
        this.navigationStack = ['sidebarChats'];
        this.currentPreviewView = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && this.navigationStack.length > 1) {
                this.goBack();
            }
        });
        document.getElementById('sidebarChatIcon')?.addEventListener('click', () => this.navigateTo('sidebarChats'));
        document.getElementById('settingsIcon')?.addEventListener('click', () => this.navigateTo('sidebarSettings'));
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.showPreview('newChat'));
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleContextMenu());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.chatSystem.logout());
        document.getElementById('settingsLogout')?.addEventListener('click', () => this.chatSystem.logout());
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('contextMenu');
            if (!contextMenu.contains(e.target) && !document.getElementById('menuBtn').contains(e.target)) {
                contextMenu.classList.add('hidden');
            }
        });
    }

    navigateTo(view, options = {}) {
        Object.values(this.views).forEach(v => v.classList.add('hidden'));
        this.views[view].classList.remove('hidden');
        this.views[view].classList.add('animate-slide-up');

        if (view !== this.navigationStack[this.navigationStack.length - 1]) {
            this.navigationStack.push(view);
        }

        if (view === 'sidebarChats') {
            this.chatSystem.loadContacts();
            this.hidePreview();
        } else if (view === 'sidebarSettings') {
            this.hidePreview();
        } else if (view === 'chatArea' && options.contactId) {
            this.chatSystem.selectContact(options.contactId);
        }
    }

    showPreview(previewType, data = {}) {
        this.currentPreviewView = previewType;
        this.views.previewPanel.classList.remove('hidden');
        this.views.previewPanel.classList.add('animate-slide-up');
        this.views.sidebarChats.classList.add('hidden');

        if (!this.navigationStack.includes('previewPanel')) {
            this.navigationStack.push('previewPanel');
        }

        switch (previewType) {
            case 'newChat':
                this.renderNewChatPreview();
                break;
            case 'newContact':
                this.renderNewContactPreview();
                break;
            case 'settings':
                this.renderSettingsPreview();
                break;
        }
    }

    hidePreview() {
        this.views.previewPanel.classList.add('animate-slide-down');
        setTimeout(() => {
            this.views.previewPanel.classList.add('hidden');
            this.views.previewPanel.innerHTML = '';
            this.views.previewPanel.classList.remove('animate-slide-down');
            this.currentPreviewView = null;
            if (this.navigationStack[this.navigationStack.length - 1] === 'sidebarChats') {
                this.views.sidebarChats.classList.remove('hidden');
                this.views.sidebarChats.classList.add('animate-slide-up');
            }
        }, 300);
    }

    goBack() {
        if (this.navigationStack.length <= 1) return;

        const currentView = this.navigationStack.pop();
        const previousView = this.navigationStack[this.navigationStack.length - 1];

        if (currentView === 'previewPanel') {
            if (this.currentPreviewView === 'newContact') {
                this.showPreview('newChat');
            } else {
                this.hidePreview();
            }
        } else {
            this.views[currentView].classList.add('animate-slide-down');
            setTimeout(() => {
                this.views[currentView].classList.add('hidden');
                this.views[currentView].classList.remove('animate-slide-down');
                this.navigateTo(previousView);
            }, 300);
        }
    }

    toggleContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.classList.toggle('hidden');
    }

    renderNewChatPreview() {
        this.modalSystem.showLoadingModal('Chargement des contacts...');
        getContacts().then(contacts => {
            this.modalSystem.hideLoadingModal();
            this.views.previewPanel.innerHTML = `
                <div class="h-full w-[600px] bg-gray-900 flex flex-col p-4">
                    <div class="flex justify-between items-center mb-4">
                        <button id="backBtn" class="text-gray-400 hover:text-white text-2xl" aria-label="Retour">←</button>
                        <h2 class="text-white text-lg font-semibold">Nouvelle discussion</h2>
                        <button id="closePreviewBtn" class="text-gray-400 hover:text-white" aria-label="Fermer">×</button>
                    </div>
                    <div class="flex-1 overflow-y-auto">
                        <button id="newContactBtn" class="flex items-center w-full p-2 text-white hover:bg-gray-700 rounded-lg">
                            <i class="fas fa-user-plus text-xl text-green-500 mr-3"></i>
                            <span>Nouveau contact</span>
                        </button>
                        ${contacts.map(c => `
                            <div class="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer contact-item" data-contact-id="${c.id}">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <span class="text-white">${c.fullName.charAt(0)}</span>
                                </div>
                                <div>
                                    <p class="text-white">${c.fullName}</p>
                                    <p class="text-gray-400 text-sm">${c.phone}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());
            document.getElementById('closePreviewBtn')?.addEventListener('click', () => this.hidePreview());
            document.getElementById('newContactBtn')?.addEventListener('click', () => this.showPreview('newContact'));
            document.querySelectorAll('.contact-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.hidePreview();
                    this.navigateTo('chatArea', { contactId: item.dataset.contactId });
                });
            });
        }).catch(() => {
            this.modalSystem.hideLoadingModal();
            this.modalSystem.showModal('Erreur de chargement des contacts.', 'error');
        });
    }

    renderNewContactPreview() {
        this.views.previewPanel.innerHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col p-4">
                <div class="flex items-center mb-4">
                    <button id="backBtn" class="text-gray-400 hover:text-white text-2xl mr-4" aria-label="Retour">←</button>
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
        document.getElementById('backBtn')?.addEventListener('click', () => this.showPreview('newChat'));
        document.getElementById('saveContactBtn')?.addEventListener('click', async () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim().replace(/\s/g, '');
            const sync = document.getElementById('syncContact').checked;
            if (!firstName || !lastName || !phone) {
                this.modalSystem.showModal('Veuillez remplir tous les champs.', 'warning');
                return;
            }
            const phoneRegex = /^[\+]?[0-9]+$/;
            if (!phoneRegex.test(phone)) {
                this.modalSystem.showModal('Numéro de téléphone invalide.', 'warning');
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
            this.modalSystem.showLoadingModal('Ajout de contact...');
            try {
                await saveContact(contactData);
                this.modalSystem.hideLoadingModal();
                this.modalSystem.showModal('Contact ajouté avec succès !', 'success');
                this.showPreview('newChat');
                await this.chatSystem.updateContactsList();
            } catch (error) {
                this.modalSystem.hideLoadingModal();
                this.modalSystem.showModal('Erreur lors de l\'ajout du contact.', 'error');
            }
        });
    }

    renderSettingsPreview() {
        this.views.previewPanel.innerHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col p-4">
                <div class="flex items-center mb-4">
                    <button id="backBtn" class="text-gray-400 hover:text-white text-2xl mr-4" aria-label="Retour">←</button>
                    <h2 class="text-white text-lg font-semibold">Paramètres</h2>
                </div>
                <div class="flex flex-col items-center py-6 border-b border-gray-800">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="avatar" class="w-24 h-24 rounded-full border-2 border-gray-700">
                    <p class="text-white font-bold mt-4">Bachir_deV</p>
                    <p class="text-gray-400 text-xs mt-2">Salut ! J'utilise WhatsApp.</p>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <ul class="divide-y divide-gray-800">
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800">Compte</a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800">Confidentialité</a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800">Discussions</a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800">Notifications</a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800">Aide</a></li>
                        <li><a href="#" id="settingsLogoutBtn" class="flex items-center px-8 py-5 hover:bg-red-800 text-red-500">Déconnexion</a></li>
                    </ul>
                </div>
            </div>
        `;
        document.getElementById('backBtn')?.addEventListener('click', () => this.goBack());
        document.getElementById('settingsLogoutBtn')?.addEventListener('click', () => this.chatSystem.logout());
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
        document.addEventListener('click', (e) => {
            if (!this.optionsMenu.contains(e.target) && !this.optionsBtn.contains(e.target)) {
                this.optionsMenu.classList.add('hidden');
            }
        });
        document.getElementById('contactSearch')?.addEventListener('input', (e) => this.filterContacts(e.target.value));
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

    filterContacts(query) {
        const contacts = document.querySelectorAll('#contactsList .contact-item');
        contacts.forEach(contact => {
            const name = contact.querySelector('p.text-white')?.textContent.toLowerCase() || '';
            const phone = contact.querySelector('p.text-gray-500')?.textContent.toLowerCase() || '';
            contact.style.display = name.includes(query.toLowerCase()) || phone.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    async updateContactsList() {
        await this.loadContacts();
    }

    async loadContacts() {
        try {
            this.modalSystem.showLoadingModal('Chargement des contacts...');
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
            this.modalSystem.hideLoadingModal();
        } catch (error) {
            this.modalSystem.hideLoadingModal();
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
        window.WhatsAppSystems.navigationSystem.navigateTo('chatArea', { contactId });
    }

    async loadMessages() {
        try {
            const messages = await getMessages(this.currentChatId);
            this.messagesContainer.innerHTML = messages.map(msg => {
                const isMe = msg.senderId === 'user_id';
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="mb-4 flex ${isMe ? 'justify-end' : 'justify-start'}">
                        <div class="${isMe ? 'message-sent' : 'message-received'} p-3 shadow">
                            <p>${msg.content}</p>
                            <span class="timestamp">${time}</span>
                        </div>
                    </div>
                `;
            }).join('');
            this.scrollToBottom();
        } catch (error) {
            this.modalSystem.showModal('Erreur de chargement des messages.', 'error');
        }
    }

    async handleSendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.currentChatId) return;
        const messageData = {
            id: Date.now().toString(),
            chatId: this.currentChatId,
            senderId: 'user_id',
            content,
            timestamp: new Date().toISOString()
        };
        try {
            this.modalSystem.showLoadingModal('Envoi du message...');
            await saveMessage(messageData);
            this.messageInput.value = '';
            await this.loadMessages();
            this.modalSystem.hideLoadingModal();
        } catch (error) {
            this.modalSystem.hideLoadingModal();
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
                this.recordBtn.classList.remove('bg-red-600');
                this.recordBtn.classList.add('bg-green-600', 'animate-pulse-slow');
                this.recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                this.modalSystem.showModal('Enregistrement en cours...', 'info');
            } catch (error) {
                this.modalSystem.showModal('Erreur d\'accès au microphone.', 'error');
            }
        } else {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordBtn.classList.remove('bg-green-600', 'animate-pulse-slow');
            this.recordBtn.classList.add('bg-red-600');
            this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            this.modalSystem.hideModal();
        }
    }

    async handleStopRecording() {
        if (this.audioChunks.length === 0) {
            this.modalSystem.showModal('Aucun audio enregistré.', 'warning');
            return;
        }
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const metadata = { duration: this.audioChunks.length * 0.02 };
        try {
            this.modalSystem.showLoadingModal('Envoi du message vocal...');
            await saveVoiceMessage(this.currentChatId, metadata);
            this.messagesContainer.innerHTML += `
                <div class="mb-4 flex justify-end">
                    <div class="voice-message p-3 shadow">
                        <audio controls src="${URL.createObjectURL(audioBlob)}"></audio>
                        <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            `;
            this.scrollToBottom();
            this.modalSystem.hideLoadingModal();
        } catch (error) {
            this.modalSystem.hideLoadingModal();
            this.modalSystem.showModal('Erreur lors de l\'envoi du message vocal.', 'error');
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    pollMessages() {
        setInterval(async () => {
            if (this.currentChatId) {
                await this.loadMessages();
            }
        }, 5000);
    }

    logout() {
        this.modalSystem.showConfirmModal(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            () => {
                this.modalSystem.showModal('Déconnexion réussie.', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            },
            'question'
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modalSystem = new ModalSystem();
    const chatSystem = new ChatSystem(modalSystem);
    const navigationSystem = new NavigationSystem(modalSystem, chatSystem);
    window.WhatsAppSystems = {
        modalSystem,
        chatSystem,
        navigationSystem
    };
});