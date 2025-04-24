// 🌍 Constantes globales
export const DB_NAME = "discordArchiveDB";
export const DB_VERSION = 1;
export const STORE_INDEX = "index";
export const STORE_CHANNELS = "channels";
export const STORE_MESSAGES = "messages";
export const STORE_DELETE = "toDelete";
export const STORE_KEEP = "toKeep";

// 📦 Ouverture ou création de la base de données
export function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (e) => {
			const db = e.target.result;
			if (!db.objectStoreNames.contains(STORE_INDEX)) {
				db.createObjectStore(STORE_INDEX);
			}
			if (!db.objectStoreNames.contains(STORE_CHANNELS)) {
				db.createObjectStore(STORE_CHANNELS, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
				db.createObjectStore(STORE_MESSAGES, { keyPath: "channelId" });
			}
			if (!db.objectStoreNames.contains(STORE_DELETE)) {
				db.createObjectStore(STORE_DELETE, { keyPath: "id" });
			}
			if (!db.objectStoreNames.contains(STORE_KEEP)) {
				db.createObjectStore(STORE_KEEP, { keyPath: "id" });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject("Erreur ouverture DB");
	});
}

// 💾 Sauvegarder dans la DB
export async function saveToIndexedDB(storeName, key, data) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readwrite");
		const store = tx.objectStore(storeName);
		if (storeName === STORE_INDEX) {
			store.put(data, key); // index.json → clé manuelle
		} else {
			// Injecte la clé comme champ unique pour keyPath
			if (storeName === STORE_CHANNELS) data.id = key;
			if (storeName === STORE_MESSAGES) data.channelId = key;
			store.put(data);
		}
		tx.oncomplete = resolve;
		tx.onerror = () => reject("Erreur lors de la sauvegarde");
	});
}

// 📥 Charger tous les éléments d’un store
export async function getAllFromIndexedDB(storeName) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readwrite");
		const store = tx.objectStore(storeName);
		const req = store.getAll();
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject("Erreur lecture DB");
	});
}

// 📜 Affichage de l'intitulé du salon grâce au index.json
export async function getItemFromIndexedDB(storeName, key) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readonly");
		const store = tx.objectStore(storeName);
		const request = store.get(key);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject("Erreur lecture d'un item");
	});
}

// 📥 Exporter les channels à supprimer en format texte
export async function telechargerChannelsToDelete() {
	const db = await openDB();
	const tx = db.transaction(STORE_DELETE, "readonly");
	const store = tx.objectStore(STORE_DELETE);

	const request = store.getAll();

	request.onsuccess = () => {
		const entries = request.result;
		if (!entries.length) {
			alert("Aucun channel dans la liste de suppression !");
			return;
		}

		const ids = entries.map(entry => entry.id);
		const blob = new Blob([ids.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "channels_to_delete.txt";
		a.click();

		URL.revokeObjectURL(url);
	};
}