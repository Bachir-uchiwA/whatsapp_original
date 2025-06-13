export function showModal(text, type) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const styles = {
        error: 'text-red-400',
        success: 'text-green-400',
        info: 'text-blue-400',
    };

    modalMessage.textContent = text;
    modalMessage.className = `text-center mb-4 ${styles[type] || styles.info}`;
    modal.classList.remove('hidden');

    document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.add('hidden');
    }, { once: true });
}

export function showConfirmModal(text, callback) {
    const modal = document.getElementById('confirm-modal');
    const modalMessage = document.getElementById('confirm-message');
    modalMessage.textContent = text;
    modal.classList.remove('hidden');

    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');

    const closeModal = () => {
        modal.classList.add('hidden');
        confirmOk.removeEventListener('click', okHandler);
        confirmCancel.removeEventListener('click', cancelHandler);
    };

    const okHandler = () => {
        callback(true);
        closeModal();
    };

    const cancelHandler = () => {
        callback(false);
        closeModal();
    };

    confirmOk.addEventListener('click', okHandler, { once: true });
    confirmCancel.addEventListener('click', cancelHandler, { once: true });
}