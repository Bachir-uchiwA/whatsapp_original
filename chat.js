// JS principal pour la page chat (nécessaire pour éviter l'erreur MIME lors du déploiement Vercel)
// Ajoute ici ton code JS spécifique à la page chat si besoin.

console.log("chat.js chargé !");

// Configuration de l'API
const API_BASE_URL = 'https://projet-json-server-4.onrender.com';

// Fonctions utilitaires pour l'API
async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`Requête API: ${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        console.log('Réponse API:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Fonction pour sauvegarder un contact
async function saveContact(contactData) {
    return await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
    });
}

// Fonction pour récupérer tous les contacts
async function getContacts() {
    return await apiRequest('/contacts');
}

// Fonction pour sauvegarder un message
async function saveMessage(messageData) {
    return await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify(messageData)
    });
}

// Fonction pour récupérer les messages
async function getMessages(chatId = null) {
    const endpoint = chatId ? `/messages?chatId=${chatId}` : '/messages';
    return await apiRequest(endpoint);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation...');
    
    // Initialiser le système de modals (déjà fait automatiquement)
    
    // Initialiser les autres fonctionnalités
    setupContextMenu();
    setupSettingsPanel();
    setupNewChatListeners();
    
    // Afficher un message de bienvenue
    setTimeout(() => {
        modalSystem.info(
            'Bienvenue sur WhatsApp Web ! Cliquez sur "Nouveau chat" pour commencer.',
            'Bienvenue'
        );
    }, 1000);
    
    // Gestion des erreurs globales
    window.addEventListener('error', function(e) {
        console.error('Erreur globale:', e.error);
        modalSystem.error('Une erreur inattendue s\'est produite. Veuillez actualiser la page.');
    });
    
    // Gestion des erreurs de promesses non capturées
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promesse rejetée:', e.reason);
        modalSystem.error('Erreur de connexion. Veuillez vérifier votre connexion internet.');
    });
    
    // Écouteur pour le bouton "Nouveau contact"
    const newContactBtn = document.querySelector('.flex.items-center.w-full.p-2.text-white.hover\\:bg-gray-700.rounded-lg:nth-child(2)');
    if (newContactBtn) {
        newContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const chatSystem = window.WhatsAppSystems.chatSystem;
            chatSystem.showNewContactForm();
            
            // Optionnel : fermer la prévisualisation du nouveau chat
            const clone = document.getElementById('tempPreview');
            const sidebarChats = document.getElementById('sidebarChats');
            if (clone && sidebarChats) {
                clone.remove();
                sidebarChats.style.display = 'flex';
            }
        });
    }
});

// Système de modals avec Tailwind CSS uniquement
class ModalSystem {
    constructor() {
        this.modal = document.getElementById('modal');
        this.confirmModal = document.getElementById('confirm-modal');
        this.loadingModal = document.getElementById('loading-modal');
        this.newChatModal = document.getElementById('newChatModal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal de base
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.hideModal();
        });

        // Modal de confirmation
        document.getElementById('confirm-cancel')?.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        // Modal nouveau chat
        document.getElementById('newChatClose')?.addEventListener('click', () => {
            this.hideNewChatModal();
        });

        // Fermer les modals en cliquant à l'extérieur
        [this.modal, this.confirmModal, this.loadingModal, this.newChatModal].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    showModal(message, type = 'info') {
        const modal = this.modal;
        const messageEl = document.getElementById('modal-message');
        const iconEl = document.getElementById('modal-icon');
        
        if (!modal || !messageEl || !iconEl) return;

        messageEl.textContent = message;
        
        // Icônes avec Tailwind
        const icons = {
            success: '<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-check text-white text-xl"></i></div>',
            error: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-times text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            info: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-info text-white text-xl"></i></div>'
        };
        
        iconEl.innerHTML = icons[type] || icons.info;
        
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
        
        // Auto-fermeture après 3 secondes pour les messages de succès
        if (type === 'success') {
            setTimeout(() => this.hideModal(), 3000);
        }
    }

    hideModal() {
        const modal = this.modal;
        if (!modal) return;
        
        modal.classList.add('animate-fade-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showConfirmModal(title, message, onConfirm, type = 'warning') {
        const modal = this.confirmModal;
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const confirmBtn = document.getElementById('confirm-ok');
        
        if (!modal || !titleEl || !messageEl || !iconEl || !confirmBtn) return;

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // Icônes avec animations Tailwind
        const icons = {
            danger: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-exclamation-triangle text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            question: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-question text-white text-xl"></i></div>'
        };
        
        iconEl.innerHTML = icons[type] || icons.warning;
        
        // Supprimer les anciens event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Ajouter le nouvel event listener
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmModal();
            if (onConfirm) onConfirm();
        });
        
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
    }

    hideConfirmModal() {
        const modal = this.confirmModal;
        if (!modal) return;
        
        modal.classList.add('animate-fade-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showLoadingModal(message = 'Chargement...') {
        const modal = this.loadingModal;
        const messageEl = document.getElementById('loading-message');
        
        if (!modal || !messageEl) return;
        
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
    }

    hideLoadingModal() {
        const modal = this.loadingModal;
        if (!modal) return;
        
        modal.classList.add('animate-fade-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showNewChatModal() {
        const modal = this.newChatModal;
        if (!modal) return;
        
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
        
        // Charger les contacts
        this.loadContacts();
    }

    hideNewChatModal() {
        const modal = this.newChatModal;
        if (!modal) return;
        
        modal.classList.add('animate-fade-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showNewContactFormInPreview() {
        const tempPreview = document.getElementById('tempPreview');
        if (!tempPreview) return;

        const newContactHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col border-r-2 border-gray-700 p-4 animate-slide-up">
                <div class="flex items-center mb-4">
                    <button id="newContactBack" class="text-gray-400 hover:text-white text-2xl mr-4">&larr;</button>
                    <h2 class="text-white text-lg font-bold">Nouveau contact</h2>
                </div>
                <div class="flex-1 space-y-4 overflow-y-auto">
                    <input type="text" id="contactFirstName" placeholder="Prénom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    <input type="text" id="contactLastName" placeholder="Nom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    <div class="flex items-center">
                        <select id="contactCountryCode" class="w-24 p-2 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="+221">SN +221</option>
                            <option value="+33">FR +33</option>
                            <option value="+1">US +1</option>
                            <option value="+44">UK +44</option>
                        </select>
                        <input type="tel" id="contactPhone" placeholder="Téléphone" class="flex-1 p-2 bg-gray-800 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="syncContact" class="w-5 h-5 text-green-500 bg-gray-800 rounded focus:ring-green-500 focus:ring-offset-gray-900">
                        <label for="syncContact" class="text-gray-300 text-sm">Synchroniser le contact sur le téléphone</label>
                    </div>
                    <button id="saveContactBtn" class="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-medium mt-4">Enregistrer</button>
                    <p class="text-gray-500 text-xs text-center">Ce contact sera ajouté au carnet d'adresses de votre téléphone.</p>
                </div>
            </div>
        `;

        tempPreview.innerHTML = newContactHTML;
        tempPreview.style.display = 'flex';

        // Gestion du bouton de retour
        const backBtn = tempPreview.querySelector('#newContactBack');
        backBtn?.addEventListener('click', () => {
            this.hideNewContactFormInPreview();
        });

        // Gestion du bouton d'enregistrement
        const saveBtn = tempPreview.querySelector('#saveContactBtn');
        saveBtn?.addEventListener('click', () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim().replace(/\s/g, '');
            const sync = document.getElementById('syncContact').checked;

            if (!firstName || !lastName || !phone) {
                window.WhatsAppSystems.modalSystem.warning('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            const phoneRegex = /^[\+]?[0-9]{10,}$/;
            if (!phoneRegex.test(phone)) {
                window.WhatsAppSystems.modalSystem.warning('Veuillez entrer un numéro de téléphone valide.');
                return;
            }
            const contactData = {
                id: Date.now(),
                name: `${firstName} ${lastName}`,
                phone: phone,
                avatar: { color: 'bg-green-500', initial: firstName.charAt(0).toUpperCase() },
                createdAt: new Date().toISOString()
            };
            window.WhatsAppSystems.modalSystem.loading('Ajout du contact...');
            saveContact(contactData)
                .then(() => {
                    window.WhatsAppSystems.modalSystem.hideLoading();
                    window.WhatsAppSystems.modalSystem.success(`Contact ${contactData.name} ajouté avec succès !`);
                    this.hideNewContactFormInPreview();
                    window.WhatsAppSystems.modalSystem.loadContacts();
                })
                .catch(error => {
                    console.error('Erreur lors de l\'ajout du contact:', error);
                    window.WhatsAppSystems.modalSystem.hideLoading();
                    window.WhatsAppSystems.modalSystem.error('Erreur lors de l\'ajout du contact. Veuillez réessayer.');
                });
        });
    }

    hideNewContactFormInPreview() {
        const tempPreview = document.getElementById('tempPreview');
        const sidebarChats = document.getElementById('sidebarChats');
        const navigationSystem = window.WhatsAppSystems.navigationSystem;

        if (tempPreview && sidebarChats) {
            navigationSystem.animateTransition(() => {
                tempPreview.style.display = 'none';
                tempPreview.innerHTML = '';
                sidebarChats.style.display = 'flex';
            });
        }
    }

    // Méthodes raccourcies pour faciliter l'utilisation
    success(message, title = 'Succès') {
        this.showModal(message, 'success');
    }

    error(message, title = 'Erreur') {
        this.showModal(message, 'error');
    }

    warning(message, title = 'Attention') {
        this.showModal(message, 'warning');
    }

    info(message, title = 'Information') {
        this.showModal(message, 'info');
    }

    confirm(title, message, onConfirm, type = 'warning') {
        this.showConfirmModal(title, message, onConfirm, type);
    }

    loading(message = 'Chargement...') {
        this.showLoadingModal(message);
    }

    hideLoading() {
        this.hideLoadingModal();
    }
}

// Système de navigation avec animations Tailwind
class NavigationSystem {
    constructor() {
        this.sidebarChats = document.getElementById('sidebarChats');
        this.sidebarSettings = document.getElementById('sidebarSettings');
        this.currentView = 'chats';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Icône chat dans la sidebar
        document.getElementById('sidebarChatIcon')?.addEventListener('click', () => {
            this.showChats();
        });

        // Icône paramètres
        document.getElementById('settingsIcon')?.addEventListener('click', () => {
            this.showSettings();
        });

        // Menu contextuel
        const menuBtn = document.getElementById('menuBtn');
        const contextMenu = document.getElementById('contextMenu');
        
        menuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleContextMenu();
        });

        // Fermer le menu contextuel
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        contextMenu?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    showChats() {
        if (this.currentView === 'chats') return;
        
        this.animateTransition(() => {
            this.sidebarSettings?.classList.add('hidden');
            this.sidebarChats?.classList.remove('hidden');
            this.currentView = 'chats';
        });
    }

    showSettings() {
        if (this.currentView === 'settings') return;
        
        this.animateTransition(() => {
            this.sidebarChats?.classList.add('hidden');
            this.sidebarSettings?.classList.remove('hidden');
            this.currentView = 'settings';
        });
    }

    animateTransition(callback) {
        // Animation de sortie
        const currentSidebar = this.currentView === 'chats' ? this.sidebarChats : this.sidebarSettings;
        currentSidebar?.classList.add('animate-slide-down');
        
        setTimeout(() => {
            callback();
            
            // Animation d'entrée
            const newSidebar = this.currentView === 'chats' ? this.sidebarSettings : this.sidebarChats;
            newSidebar?.classList.add('animate-slide-up');
            
            // Nettoyer les classes d'animation
            setTimeout(() => {
                currentSidebar?.classList.remove('animate-slide-down');
                newSidebar?.classList.remove('animate-slide-up');
            }, 300);
        }, 200);
    }

    toggleContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        if (contextMenu.classList.contains('hidden')) {
            contextMenu.classList.remove('hidden');
            contextMenu.classList.add('animate-scale-in');
        } else {
            this.hideContextMenu();
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu || contextMenu.classList.contains('hidden')) return;

        contextMenu.classList.add('animate-scale-out');
        setTimeout(() => {
            contextMenu.classList.add('hidden');
            contextMenu.classList.remove('animate-scale-in', 'animate-scale-out');
        }, 200);
    }
}

// Système de chat et messages
class ChatSystem {
    constructor(modalSystem) {
        this.modalSystem = modalSystem;
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.sendIcon = document.getElementById('sendIcon');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.charCount = document.getElementById('charCount');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.currentChatId = 'default';
        this.setupEventListeners();
        this.setupEmojiPanel();
        this.setupChatItemHandlers();
    }

    setupEventListeners() {
        // Gestion de l'input message
        this.messageInput?.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });

        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Bouton d'envoi
        this.sendBtn?.addEventListener('click', () => {
            if (this.messageInput?.value.trim()) {
                this.sendMessage();
            } else {
                this.startVoiceRecording();
            }
        });

        // Bouton pièce jointe
        document.getElementById('attachBtn')?.addEventListener('click', () => {
            this.showAttachmentOptions();
        });

        // Simulation de réception de messages
        this.simulateIncomingMessages();
    }

    handleInputChange(e) {
        const value = e.target.value;
        const length = value.length;
        
        // Mettre à jour le compteur de caractères
        if (this.charCount) {
            this.charCount.textContent = length;
            
            // Changer la couleur selon la limite
            if (length > 900) {
                this.charCount.className = 'text-red-400';
            } else if (length > 700) {
                this.charCount.className = 'text-yellow-400';
            } else {
                this.charCount.className = 'text-gray-500';
            }
        }

        // Changer l'icône du bouton d'envoi
        if (this.sendIcon) {
            if (value.trim()) {
                this.sendIcon.className = 'fas fa-paper-plane text-xl';
                this.sendBtn?.classList.remove('bg-green-600', 'hover:bg-green-700');
                this.sendBtn?.classList.add('bg-blue-600', 'hover:bg-blue-700');
            } else {
                this.sendIcon.className = 'fas fa-microphone text-xl';
                this.sendBtn?.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                this.sendBtn?.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        }

        // Simuler l'indicateur de frappe
        this.showTypingIndicator();
    }

    async sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message) return;

        try {
            // Créer l'objet message
            const messageData = {
                id: Date.now(),
                chatId: this.currentChatId,
                text: message,
                timestamp: new Date().toISOString(),
                sender: 'me',
                status: 'sent'
            };

            // Ajouter le message à l'interface
            this.addMessageToUI(messageData);

            // Vider l'input
            this.messageInput.value = '';
            this.handleInputChange({ target: { value: '' } });

            // Sauvegarder le message (optionnel)
            try {
                await saveMessage(messageData);
                this.updateMessageStatus(messageData.id, 'delivered');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
            }

            // Simuler une réponse automatique
            setTimeout(() => {
                this.simulateAutoReply();
            }, 1000 + Math.random() * 2000);

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            this.modalSystem.error('Erreur lors de l\'envoi du message');
        }
    }

    addMessageToUI(messageData) {
        if (!this.messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `flex items-start space-x-2 animate-slide-up ${
            messageData.sender === 'me' ? 'justify-end' : ''
        }`;
        messageEl.dataset.messageId = messageData.id;

        const isMe = messageData.sender === 'me';
        const time = new Date(messageData.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isMe) {
            messageEl.innerHTML = `
                <div class="max-w-xs lg:max-w-md">
                    <div class="bg-green-600 text-white p-3 rounded-lg rounded-tr-none shadow-lg">
                        <p class="text-sm">${this.escapeHtml(messageData.text)}</p>
                        <div class="flex items-center justify-end mt-1 space-x-1">
                            <span class="text-xs text-green-200">${time}</span>
                            <i class="fas fa-check text-xs text-green-200" data-status="${messageData.status}"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="w-8 h-8 bg-blue-500 rounded-full flex-shrink-0 overflow-hidden">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzQjgyRjYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxMyIgcj0iNSIgZmlsbD0iI0Y5RkFGQiIvPgo8cGF0aCBkPSJNOCAyNmMwLTUgNS04IDgtOHM4IDMgOCA4IiBmaWxsPSIjRjlGQUZCIi8+Cjwvc3ZnPgo=" alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div class="max-w-xs lg:max-w-md">
                    <div class="bg-gray-700 text-white p-3 rounded-lg rounded-tl-none shadow-lg">
                        <p class="text-sm">${this.escapeHtml(messageData.text)}</p>
                        <div class="flex items-center justify-end mt-1 space-x-1">
                            <span class="text-xs text-gray-400">${time}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    updateMessageStatus(messageId, status) {
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageEl) return;

        const statusIcon = messageEl.querySelector('[data-status]');
        if (!statusIcon) return;

        statusIcon.dataset.status = status;
        
        switch (status) {
            case 'sent':
                statusIcon.className = 'fas fa-check text-xs text-green-200';
                break;
            case 'delivered':
                statusIcon.className = 'fas fa-check-double text-xs text-green-200';
                break;
            case 'read':
                statusIcon.className = 'fas fa-check-double text-xs text-blue-300';
                break;
        }
    }

    simulateAutoReply() {
        const replies = [
            "C'est intéressant ! 🤔",
            "Je suis d'accord avec toi",
            "Ah bon ? Raconte-moi plus !",
            "😂 Tu me fais rire !",
            "C'est une bonne idée ça",
            "Je vais y réfléchir",
            "Merci pour l'info ! 👍",
            "On en reparle plus tard ?",
            "Super ! 🎉",
            "Pas mal du tout !"
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const messageData = {
            id: Date.now(),
            chatId: this.currentChatId,
            text: randomReply,
            timestamp: new Date().toISOString(),
            sender: 'contact',
            status: 'received'
        };

        this.addMessageToUI(messageData);
    }

    showTypingIndicator() {
        if (!this.typingIndicator) return;

        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();

        // Cacher l'indicateur après 2 secondes
        setTimeout(() => {
            this.typingIndicator?.classList.add('hidden');
        }, 2000);
    }

    startVoiceRecording() {
        this.modalSystem.info('Fonctionnalité d\'enregistrement vocal en cours de développement');
    }

    showAttachmentOptions() {
        this.modalSystem.info('Options de pièces jointes en cours de développement');
    }

    setupEmojiPanel() {
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPanel = document.getElementById('emojiPanel');

        emojiBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiPanel();
        });

        // Fermer le panneau d'emojis en cliquant ailleurs
        document.addEventListener('click', () => {
            this.hideEmojiPanel();
        });

        emojiPanel?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Gestion des clics sur les emojis
        emojiPanel?.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const emoji = e.target.textContent;
                this.insertEmoji(emoji);
            }
        });
    }

    toggleEmojiPanel() {
        const emojiPanel = document.getElementById('emojiPanel');
        if (!emojiPanel) return;

        if (emojiPanel.classList.contains('hidden')) {
            emojiPanel.classList.remove('hidden');
            emojiPanel.classList.add('animate-scale-in');
        } else {
            this.hideEmojiPanel();
        }
    }

    hideEmojiPanel() {
        const emojiPanel = document.getElementById('emojiPanel');
        if (!emojiPanel || emojiPanel.classList.contains('hidden')) return;

        emojiPanel.classList.add('animate-scale-out');
        setTimeout(() => {
            emojiPanel.classList.add('hidden');
            emojiPanel.classList.remove('animate-scale-in', 'animate-scale-out');
        }, 200);
    }

    insertEmoji(emoji) {
        if (!this.messageInput) return;

        const cursorPos = this.messageInput.selectionStart;
        const textBefore = this.messageInput.value.substring(0, cursorPos);
        const textAfter = this.messageInput.value.substring(cursorPos);
        
        this.messageInput.value = textBefore + emoji + textAfter;
        this.messageInput.focus();
        this.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        // Déclencher l'événement input pour mettre à jour le compteur
        this.handleInputChange({ target: { value: this.messageInput.value } });
        
        this.hideEmojiPanel();
    }

    simulateIncomingMessages() {
        // Simuler des messages entrants de temps en temps
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% de chance toutes les 10 secondes
                this.simulateAutoReply();
            }
        }, 10000);
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupChatItemHandlers() {
        const chatItems = document.querySelectorAll('.flex.items-center.w-full.p-2.text-white.hover\\:bg-gray-700.rounded-lg');
        chatItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewContactForm();
            });
        });
    }

    showNewContactForm() {
        const newContactHTML = `
            <div class="bg-gray-900 p-4 rounded-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-white text-lg font-bold">Nouveau contact</h2>
                    <button id="newContactClose" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div class="space-y-4">
                    <input type="text" id="contactFirstName" placeholder="Prénom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <input type="text" id="contactLastName" placeholder="Nom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="flex items-center">
                        <select id="contactCountryCode" class="w-20 p-2 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="+221">SN +221</option>
                            <!-- Add more country codes as needed -->
                        </select>
                        <input type="tel" id="contactPhone" placeholder="Téléphone" class="w-full p-2 bg-gray-800 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="syncContact" class="text-blue-500 focus:ring-blue-500">
                        <label for="syncContact" class="text-gray-400 text-sm">Synchroniser le contact sur le téléphone</label>
                    </div>
                    <button id="saveContactBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg">Enregistrer</button>
                    <p class="text-gray-500 text-xs">Ce contact sera ajouté au carnet d'adresses de votre téléphone.</p>
                </div>
            </div>
        `;

        this.modalSystem.showModal(newContactHTML, 'custom');
        
        document.getElementById('newContactClose')?.addEventListener('click', () => {
            this.modalSystem.hideModal();
        });

        document.getElementById('saveContactBtn')?.addEventListener('click', () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim();
            const sync = document.getElementById('syncContact').checked;

            if (firstName && lastName && phone) {
                const contactData = {
                    id: Date.now(),
                    name: `${firstName} ${lastName}`,
                    phone: phone,
                    avatar: { color: 'bg-blue-500', initial: firstName.charAt(0).toUpperCase() },
                    createdAt: new Date().toISOString()
                };
                saveContact(contactData).then(() => {
                    this.modalSystem.success(`Contact ${contactData.name} ajouté avec succès !`);
                    this.modalSystem.hideModal();
                    this.modalSystem.loadContacts(); // Refresh contacts list if implemented
                }).catch(error => {
                    console.error('Error saving contact:', error);
                    this.modalSystem.error('Erreur lors de l\'ajout du contact');
                });
            } else {
                this.modalSystem.warning('Veuillez remplir tous les champs');
            }
        });
    }
}

// Système d'authentification avec animations
class AuthSystem {
    constructor(modalSystem) {
        this.modalSystem = modalSystem;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Boutons de déconnexion
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        document.getElementById('settingsLogout')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Nouveau chat
        document.getElementById('newChatBtn')?.addEventListener('click', () => {
            this.handleNewChat();
        });
    }

    handleLogout() {
        this.modalSystem.confirm(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            () => {
                this.performLogout();
            },
            'danger'
        );
    }

    performLogout() {
        this.modalSystem.loading('Déconnexion en cours...');
        
        // Simulation de la déconnexion
        setTimeout(() => {
            this.modalSystem.hideLoading();
            
            // Animation de sortie de la page
            document.body.classList.add('animate-fade-out');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        }, 1500);
    }

    handleNewChat() {
        this.modalSystem.showNewChatModal();
    }
}

// Système de contacts
class ContactSystem {
    constructor(modalSystem) {
        this.modalSystem = modalSystem;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulaire d'ajout de contact
        const addContactForm = document.getElementById('addContactForm');
        addContactForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddContact();
        });

        // Recherche de contacts
        const contactSearch = document.getElementById('contactSearch');
        contactSearch?.addEventListener('input', (e) => {
            this.handleContactSearch(e.target.value);
        });
    }

    async handleAddContact() {
        const nameInput = document.getElementById('contactName');
        const phoneInput = document.getElementById('contactPhone');

        if (!nameInput || !phoneInput) return;

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !phone) {
            this.modalSystem.warning('Veuillez remplir tous les champs');
            return;
        }

        // Validation du numéro de téléphone
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
            this.modalSystem.warning('Veuillez entrer un numéro de téléphone valide');
            return;
        }

        try {
            this.modalSystem.loading('Ajout du contact...');

            const contactData = {
                id: Date.now(),
                name: name,
                phone: phone,
                avatar: this.generateAvatar(name),
                createdAt: new Date().toISOString()
            };

            await saveContact(contactData);

            this.modalSystem.hideLoading();
            this.modalSystem.success(`Contact ${name} ajouté avec succès !`);

            // Vider le formulaire
            nameInput.value = '';
            phoneInput.value = '';

            // Recharger la liste des contacts
            this.modalSystem.loadContacts();

        } catch (error) {
            console.error('Erreur lors de l\'ajout du contact:', error);
            this.modalSystem.hideLoading();
            this.modalSystem.error('Erreur lors de l\'ajout du contact');
        }
    }

    handleContactSearch(query) {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        const contacts = contactsList.querySelectorAll('div[class*="flex items-center"]');
        
        contacts.forEach(contact => {
            const name = contact.querySelector('.text-white')?.textContent.toLowerCase() || '';
            const phone = contact.querySelector('.text-gray-400')?.textContent.toLowerCase() || '';
            
            if (name.includes(query.toLowerCase()) || phone.includes(query.toLowerCase())) {
                contact.style.display = 'flex';
            } else {
                contact.style.display = 'none';
            }
        });
    }

    generateAvatar(name) {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return {
            color: randomColor,
            initial: name.charAt(0).toUpperCase()
        };
    }
}

// Système d'effets visuels avec Tailwind
class VisualEffectsSystem {
    constructor() {
        this.setupHoverEffects();
        this.setupScrollEffects();
        this.setupNotificationEffects();
        this.setupThemeEffects();
    }

    setupHoverEffects() {
        // Effet de survol sur les éléments de chat
        const chatItems = document.querySelectorAll('[class*="hover:bg-gray-"]');
        chatItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.classList.add('transform', 'transition-all', 'duration-200');
            });
        });

        // Effet de survol sur les boutons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('transform', 'transition-all', 'duration-200');
            });
        });
    }

    setupScrollEffects() {
        // Effet de scroll personnalisé
        const scrollableElements = document.querySelectorAll('.overflow-y-auto');
        scrollableElements.forEach(element => {
            element.addEventListener('scroll', () => {
                // Ajouter une ombre en haut quand on scroll
                if (element.scrollTop > 0) {
                    element.classList.add('shadow-inner');
                } else {
                    element.classList.remove('shadow-inner');
                }
            });
        });
    }

    setupNotificationEffects() {
        // Animation des badges de notification
        const badges = document.querySelectorAll('.bg-green-500');
        badges.forEach(badge => {
            if (badge.textContent && parseInt(badge.textContent) > 0) {
                badge.classList.add('animate-pulse');
                
                // Effet de "bounce" périodique
                setInterval(() => {
                    badge.classList.add('animate-bounce');
                    setTimeout(() => {
                        badge.classList.remove('animate-bounce');
                    }, 1000);
                }, 5000);
            }
        });
    }

    setupThemeEffects() {
        // Effet de transition de thème
        document.body.style.transition = 'background-color 0.3s ease';
        
        // Effet de particules en arrière-plan (optionnel)
        this.createParticleEffect();
    }

    createParticleEffect() {
        // Créer un effet de particules subtil en arrière-plan
        const particleContainer = document.createElement('div');
        particleContainer.className = 'fixed inset-0 pointer-events-none z-0';
        particleContainer.style.background = `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
        `;
        
        document.body.appendChild(particleContainer);
    }
}

// Système de notifications toast
class ToastSystem {
    constructor() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.createContainer();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `
            max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
            ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all 
            duration-300 ease-in-out animate-slide-up
        `;

        const colors = {
            success: 'border-l-4 border-green-500',
            error: 'border-l-4 border-red-500',
            warning: 'border-l-4 border-yellow-500',
            info: 'border-l-4 border-blue-500'
        };

        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };

        toast.innerHTML = `
            <div class="p-4 ${colors[type] || colors.info}">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${icons[type] || icons.info}"></i>
                    </div>
                    <div class="ml-3 w-0 flex-1 pt-0.5">
                        <p class="text-sm font-medium text-white">${message}</p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button class="toast-close bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter l'événement de fermeture
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', () => {
            this.remove(toast);
        });

        this.container?.appendChild(toast);

        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.add('animate-fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Système de raccourcis clavier
class KeyboardShortcuts {
    constructor(modalSystem, chatSystem, navigationSystem) {
        this.modalSystem = modalSystem;
        this.chatSystem = chatSystem;
        this.navigationSystem = navigationSystem;
        this.setupShortcuts();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N : Nouveau chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.modalSystem.showNewChatModal();
            }

            // Ctrl/Cmd + , : Paramètres
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.navigationSystem.showSettings();
            }

            // Ctrl/Cmd + 1 : Retour aux chats
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                this.navigationSystem.showChats();
            }

            // Ctrl/Cmd + E : Panneau d'emojis
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.chatSystem.toggleEmojiPanel();
            }

            // Ctrl/Cmd + Shift + L : Déconnexion
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.modalSystem.confirm(
                    'Déconnexion',
                    'Êtes-vous sûr de vouloir vous déconnecter ?',
                    () => {
                        window.location.href = '/';
                    },
                    'danger'
                );
            }

            // F1 : Aide
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });
    }

    showHelp() {
        const shortcuts = [
            'Ctrl+N : Nouveau chat',
            'Ctrl+, : Paramètres',
            'Ctrl+1 : Retour aux chats',
            'Ctrl+E : Panneau d\'emojis',
            'Entrée : Envoyer le message',
            'Échap : Fermer les modals',
            'F1 : Afficher cette aide'
        ];

        this.modalSystem.showModal(
            'Raccourcis clavier disponibles :\n\n' + shortcuts.join('\n'),
            'info'
        );
    }
}

// Système de gestion d'état
class StateManager {
    constructor() {
        this.state = {
            currentChat: null,
            user: null,
            contacts: [],
            messages: [],
            settings: {
                theme: 'dark',
                notifications: true,
                sounds: true
            }
        };
        this.loadState();
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('whatsapp_state');
            if (savedState) {
                this.state = { ...this.state, ...JSON.parse(savedState) };
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état:', error);
        }
    }

    saveState() {
        try {
            localStorage.setItem('whatsapp_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état:', error);
        }
    }

    updateState(key, value) {
        this.state[key] = value;
        this.saveState();
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }
}

// Système de gestion des erreurs
class ErrorHandler {
    constructor(modalSystem, toastSystem) {
        this.modalSystem = modalSystem;
        this.toastSystem = toastSystem;
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Erreurs JavaScript
        window.addEventListener('error', (e) => {
            console.error('Erreur JavaScript:', e.error);
            this.handleError(e.error, 'Erreur inattendue');
        });

        // Promesses rejetées
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesse rejetée:', e.reason);
            this.handleError(e.reason, 'Erreur de connexion');
        });

        // Erreurs de réseau
        window.addEventListener('offline', () => {
            this.toastSystem.warning('Connexion perdue. Vérifiez votre connexion internet.');
        });

        window.addEventListener('online', () => {
            this.toastSystem.success('Connexion rétablie !');
        });
    }

    handleError(error, userMessage = 'Une erreur s\'est produite') {
        // Log détaillé pour le développement
        console.error('Erreur détaillée:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Message utilisateur simplifié
        this.toastSystem.error(userMessage);

        // Pour les erreurs critiques, afficher un modal
        if (this.isCriticalError(error)) {
            this.modalSystem.error(
                'Une erreur critique s\'est produite. Veuillez actualiser la page.'
            );
        }
    }

    isCriticalError(error) {
        const criticalPatterns = [
            'Network Error',
            'Failed to fetch',
            'TypeError: Cannot read property',
            'ReferenceError'
        ];

        return criticalPatterns.some(pattern => 
            error.message && error.message.includes(pattern)
        );
    }
}

// Système de performance et optimisation
class PerformanceOptimizer {
    constructor() {
        this.setupLazyLoading();
        this.setupVirtualScrolling();
        this.setupImageOptimization();
    }

    setupLazyLoading() {
        // Observer pour le lazy loading des images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observer toutes les images avec data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    setupVirtualScrolling() {
        // Implémentation basique du virtual scrolling pour les longues listes
        const chatList = document.querySelector('.overflow-y-auto');
        if (!chatList) return;

        let isScrolling = false;
        chatList.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    // Logique de virtual scrolling ici
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    setupImageOptimization() {
        // Compression et redimensionnement automatique des images
        const processImage = (file, maxWidth = 800, quality = 0.8) => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                    canvas.width = img.width * ratio;
                    canvas.height = img.height * ratio;

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };

                img.src = URL.createObjectURL(file);
            });
        };

        // Exposer la fonction globalement
        window.processImage = processImage;
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de WhatsApp Web...');

    // Initialiser tous les systèmes
    const stateManager = new StateManager();
    const modalSystem = new ModalSystem();
    const toastSystem = new ToastSystem();
    const navigationSystem = new NavigationSystem();
    const chatSystem = new ChatSystem(modalSystem);
    const authSystem = new AuthSystem(modalSystem);
    const contactSystem = new ContactSystem(modalSystem);
    const visualEffects = new VisualEffectsSystem();
    const keyboardShortcuts = new KeyboardShortcuts(modalSystem, chatSystem, navigationSystem);
    const errorHandler = new ErrorHandler(modalSystem, toastSystem);
    const performanceOptimizer = new PerformanceOptimizer();

    // Rendre les systèmes accessibles globalement pour le débogage
    window.WhatsAppSystems = {
        stateManager,
        modalSystem,
        toastSystem,
        navigationSystem,
        chatSystem,
        authSystem,
        contactSystem,
        visualEffects,
        keyboardShortcuts,
        errorHandler,
        performanceOptimizer
    };

    // Animation d'entrée de la page
    document.body.classList.add('animate-fade-in');

    // Message de bienvenue avec animation
    setTimeout(() => {
        toastSystem.success('Bienvenue sur WhatsApp Web ! 🎉');
        
        // Afficher les raccourcis clavier après 3 secondes
        setTimeout(() => {
            toastSystem.info('Appuyez sur F1 pour voir les raccourcis clavier');
        }, 3000);
    }, 1000);

    // Vérifier la connexion internet
    if (!navigator.onLine) {
        toastSystem.warning('Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.');
    }

    // Initialiser les données de démonstration
    initializeDemoData();

    console.log('✅ WhatsApp Web initialisé avec succès !');
});

// Fonction d'initialisation des données de démonstration
async function initializeDemoData() {
    try {
        // Vérifier si des contacts existent déjà
        const existingContacts = await getContacts();
        
        if (existingContacts.length === 0) {
            // Ajouter quelques contacts de démonstration
            const demoContacts = [
                {
                    id: 1,
                    name: 'Alice Martin',
                    phone: '+33 6 12 34 56 78',
                    avatar: { color: 'bg-blue-500', initial: 'A' },
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Bob Dupont',
                    phone: '+33 6 98 76 54 32',
                    avatar: { color: 'bg-green-500', initial: 'B' },
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Claire Moreau',
                    phone: '+33 6 11 22 33 44',
                    avatar: { color: 'bg-purple-500', initial: 'C' },
                    createdAt: new Date().toISOString()
                }
            ];

            for (const contact of demoContacts) {
                try {
                    await saveContact(contact);
                } catch (error) {
                    console.warn('Impossible d\'ajouter le contact de démo:', contact.name);
                }
            }

            console.log('📝 Contacts de démonstration ajoutés');
        }
    } catch (error) {
        console.warn('Impossible d\'initialiser les données de démonstration:', error);
    }
}

// Fonctions utilitaires globales
window.utils = {
    // Formater une date
    formatDate: (date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffTime = Math.abs(now - messageDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Aujourd\'hui';
        } else if (diffDays === 2) {
            return 'Hier';
        } else if (diffDays <= 7) {
            return messageDate.toLocaleDateString('fr-FR', { weekday: 'long' });
        } else {
            return messageDate.toLocaleDateString('fr-FR');
        }
    },

    // Formater une heure
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Générer un ID unique
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Valider un numéro de téléphone
    validatePhone: (phone) => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },

    // Échapper le HTML
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Détecter les liens dans le texte
    linkify: (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>');
    },

    // Copier du texte dans le presse-papiers
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            window.WhatsAppSystems?.toastSystem?.success('Copié dans le presse-papiers');
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
            window.WhatsAppSystems?.toastSystem?.error('Impossible de copier le texte');
        }
    }
};

// Gestion de l'aperçu du nouveau chat
document.addEventListener('DOMContentLoaded', function() {
    const plusIcon = document.querySelector('.fas.fa-plus-circle.text-xl');
    const sidebarChats = document.querySelector('#sidebarChats');
    const closePreview = document.getElementById('closePreview');
    const previewContent = document.querySelector('#newChatPreview .h-full');
  
    if (plusIcon && sidebarChats && closePreview && previewContent) {
        plusIcon.addEventListener('click', function() {
            // Cache la sidebar des chats
            sidebarChats.style.display = 'none';
            
            // Clone le contenu de prévisualisation et l'insère à la place
            const clone = previewContent.cloneNode(true);
            clone.id = 'tempPreview';
            sidebarChats.parentNode.insertBefore(clone, sidebarChats);
            
            // Ajoute l'événement de fermeture au clone
            clone.querySelector('#closePreview').addEventListener('click', function() {
                clone.remove();
                sidebarChats.style.display = 'flex';
            });
        });
    }
});

// Gestion des Service Workers pour le mode hors ligne
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

console.log('📱 WhatsApp Web Clone - Développé avec Tailwind CSS');
console.log('🔧 Systèmes disponibles:', Object.keys(window.WhatsAppSystems || {}));
console.log('🛠️ Utilitaires disponibles:', Object.keys(window.utils || {}));