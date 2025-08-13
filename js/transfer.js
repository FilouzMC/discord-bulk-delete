import { afficherChannelAleatoire, updateCompteurRestants } from "./randomChannel.js";
import { openDB, saveToIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_KEEP, STORE_DELETE } from "./db.js";

// 🔄 Transférer un channel d'un store à un autre
// 🔄 Transfer a channel from one store to another
export async function transferChannel(channelId, fromStore, toStore) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([fromStore, toStore], "readwrite");
        const from = tx.objectStore(fromStore);
        const to = tx.objectStore(toStore);

        const getReq = from.get(channelId);
        getReq.onsuccess = () => {
            const data = getReq.result;
            if (!data) return reject("No data to transfert.");
            to.put(data);      // add in toStore
            from.delete(channelId); // delete in fromStore
        };
        getReq.onerror = () => reject("Error read/transfert");

        tx.oncomplete = resolve;
    });
}

// ✅ "Keep" or "Delete" a channel
export async function garderChannel() {
    if (!window.currentChannelId) return;
    const channel = await getItemFromIndexedDB(STORE_CHANNELS, window.currentChannelId);
    if (!channel) return;
    // Initialiser l'historique des actions si ce n'est pas déjà fait
    // Initialize the action history if not already done
    if (!window.historiqueActions) {
        window.historiqueActions = [];
    }

    // 🔙 Stocker dans l'historique
    // 🔙 Store in history
    window.historiqueActions.push({
        store: STORE_KEEP,
        channelId: window.currentChannelId,
        data: channel
    });

    await transferChannel(window.currentChannelId, STORE_CHANNELS, STORE_KEEP);
    await afficherChannelAleatoire();
    await updateCompteurRestants();
}

// ❌ "Keep" or "Delete" a channel
export async function supprimerChannel() {
    if (!window.currentChannelId) return;
    const channel = await getItemFromIndexedDB(STORE_CHANNELS, window.currentChannelId);
    if (!channel) return;
    // Initialiser l'historique des actions si ce n'est pas déjà fait
    // Initialize the action history if not already done
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
    await updateCompteurRestants();
}

// 🔄 Revenir en arrière
// 🔄 Go back to the last action
export async function annulerDerniereAction() {
    if (window.historiqueActions.length === 0) {
        alert("No action to undo!");
        return;
    }

    const last = window.historiqueActions.pop();

    // 🔄 Remettre dans STORE_CHANNELS
    // 🔄 Put back in STORE_CHANNELS
    await saveToIndexedDB(STORE_CHANNELS, last.channelId, last.data);

    // ❌ Supprimer de l'ancien store (toDelete ou toKeep)
    // ❌ Delete from the old store (toDelete or toKeep)
    const db = await openDB();
    const tx = db.transaction(last.store, "readwrite");
    const store = tx.objectStore(last.store);
    store.delete(last.channelId);

    await afficherChannelAleatoire();
}