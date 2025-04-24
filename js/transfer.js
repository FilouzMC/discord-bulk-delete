import { afficherChannelAleatoire } from "./randomChannel.js";
import { openDB, saveToIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_KEEP, STORE_DELETE } from "./db.js";
// 🔄 Transférer un channel d'un store à un autre
export async function transferChannel(channelId, fromStore, toStore) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([fromStore, toStore], "readwrite");
        const from = tx.objectStore(fromStore);
        const to = tx.objectStore(toStore);

        const getReq = from.get(channelId);
        getReq.onsuccess = () => {
            const data = getReq.result;
            if (!data) return reject("Aucune donnée à transférer.");
            to.put(data);      // ajoute dans toStore
            from.delete(channelId); // supprime dans fromStore
        };
        getReq.onerror = () => reject("Erreur lecture/transfert");

        tx.oncomplete = resolve;
    });
}

// ✅ "Keep" ou "Delete" un channel
export async function garderChannel() {
    if (!window.currentChannelId) return;
    const channel = await getItemFromIndexedDB(STORE_CHANNELS, window.currentChannelId);
    if (!channel) return;
    // Initialiser l'historique des actions si ce n'est pas déjà fait
    if (!window.historiqueActions) {
        window.historiqueActions = [];
    }

    // 🔙 Stocker dans l'historique
    window.historiqueActions.push({
        store: STORE_KEEP,
        channelId: window.currentChannelId,
        data: channel
    });

    await transferChannel(window.currentChannelId, STORE_CHANNELS, STORE_KEEP);
    await afficherChannelAleatoire();
}

// ❌ "Keep" ou "Delete" un channel
export async function supprimerChannel() {
    if (!window.currentChannelId) return;
    const channel = await getItemFromIndexedDB(STORE_CHANNELS, window.currentChannelId);
    if (!channel) return;
    // Initialiser l'historique des actions si ce n'est pas déjà fait
    if (!window.historiqueActions) {
        window.historiqueActions = [];
    }

    window.historiqueActions.push({
        store: STORE_DELETE,
        channelId: window.currentChannelId,
        data: channel
    });

    await transferChannel(window.currentChannelId, STORE_CHANNELS, STORE_DELETE);
    await afficherChannelAleatoire();
}

// 🔄 Revenir en arrière
export async function annulerDerniereAction() {
    if (window.historiqueActions.length === 0) {
        alert("Aucune action à annuler !");
        return;
    }

    const last = window.historiqueActions.pop();

    // 🔄 Remettre dans STORE_CHANNELS
    await saveToIndexedDB(STORE_CHANNELS, last.channelId, last.data);

    // ❌ Supprimer de l'ancien store (toDelete ou toKeep)
    const db = await openDB();
    const tx = db.transaction(last.store, "readwrite");
    const store = tx.objectStore(last.store);
    store.delete(last.channelId);

    await afficherChannelAleatoire();
}