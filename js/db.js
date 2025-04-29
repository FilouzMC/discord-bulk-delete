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

// 📤 Exporter toute la base de données et localStorage en fichier JSON
export async function exporterBaseDeDonnees() {
	try {
		// Récupérer les données de chaque store IndexedDB
		const index = await getAllFromIndexedDB(STORE_INDEX);
		const channels = await getAllFromIndexedDB(STORE_CHANNELS);
		const messages = await getAllFromIndexedDB(STORE_MESSAGES);
		const toDelete = await getAllFromIndexedDB(STORE_DELETE);
		const toKeep = await getAllFromIndexedDB(STORE_KEEP);

		// Récupérer l'index spécifique "indexJson"
		const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");

		// Récupérer tout le localStorage
		const localStorageData = {};
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			let value = localStorage.getItem(key);

			// Essayer de parser les valeurs JSON si possible
			try {
				value = JSON.parse(value);
			} catch (e) {
				// Si ce n'est pas du JSON, garder la valeur string
			}

			localStorageData[key] = value;
		}

		// Créer l'objet de sauvegarde
		const backup = {
			version: DB_VERSION,
			date: new Date().toISOString(),
			data: {
				indexedDB: {
					index: { indexJson },
					channels,
					messages,
					toDelete,
					toKeep
				},
				localStorage: localStorageData
			}
		};

		// Convertir en JSON et créer un blob
		const jsonData = JSON.stringify(backup, null, 2);
		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		// Télécharger le fichier
		const a = document.createElement("a");
		const date = new Date().toISOString().split('T')[0];
		a.href = url;
		a.download = `discord_backup_${date}.json`;
		a.click();

		URL.revokeObjectURL(url);
		return true;
	} catch (error) {
		console.error("Erreur lors de l'exportation :", error);
		return false;
	}
}

// 📥 Importer une base de données depuis un fichier JSON
export async function importerBaseDeDonnees(fileInputElement) {
	return new Promise((resolve, reject) => {
		if (!fileInputElement.files || fileInputElement.files.length === 0) {
			reject("Aucun fichier sélectionné");
			return;
		}

		const file = fileInputElement.files[0];
		if (!file.type.match('application/json')) {
			reject("Le fichier doit être au format JSON");
			return;
		}

		const reader = new FileReader();

		reader.onload = async (event) => {
			try {
				const data = JSON.parse(event.target.result);

				// Vérifier la structure du fichier
				if (!data.version || !data.data) {
					reject("Format de fichier de sauvegarde invalide");
					return;
				}

				// Importer les données IndexedDB
				if (data.data.indexedDB) {
					await importerDonneesIndexedDB(data.data.indexedDB);
				}

				// Importer les données localStorage
				if (data.data.localStorage) {
					importerLocalStorage(data.data.localStorage);
				}

				resolve(true);
			} catch (error) {
				reject(`Erreur lors de l'importation : ${error.message}`);
			}
		};

		reader.onerror = () => reject("Erreur lors de la lecture du fichier");
		reader.readAsText(file);
	});
}

// 🔄 Importer les données dans IndexedDB
async function importerDonneesIndexedDB(data) {
	const db = await openDB();

	// Traiter chaque store
	if (data.index && data.index.indexJson) {
		await saveToIndexedDB(STORE_INDEX, "indexJson", data.index.indexJson);
	}

	// Importer les channels
	if (data.channels && Array.isArray(data.channels)) {
		await importerStore(data.channels, STORE_CHANNELS);
	}

	// Importer les messages
	if (data.messages && Array.isArray(data.messages)) {
		await importerStore(data.messages, STORE_MESSAGES);
	}

	// Importer toDelete et toKeep
	await importerStore(data.toDelete, STORE_DELETE);
	await importerStore(data.toKeep, STORE_KEEP);

	return true;
}

// 📝 Importer les données dans localStorage
function importerLocalStorage(data) {
	// Optionnel: effacer le localStorage existant
	// localStorage.clear();

	// Importer les données
	for (const key in data) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			let value = data[key];

			// Convertir en chaîne si c'est un objet ou un tableau
			if (typeof value === 'object' && value !== null) {
				value = JSON.stringify(value);
			}

			localStorage.setItem(key, value);
		}
	}
}

// 🧰 Fonction utilitaire pour importer un store
async function importerStore(items, storeName) {
	if (!items || !Array.isArray(items)) return;

	const db = await openDB();
	const tx = db.transaction(storeName, "readwrite");
	const store = tx.objectStore(storeName);

	for (const item of items) {
		if (item) {
			// Déterminer la clé en fonction du store
			if (storeName === STORE_MESSAGES && item.channelId) {
				store.put(item);
			} else if (item.id) {
				store.put(item);
			}
		}
	}

	return new Promise((resolve, reject) => {
		tx.oncomplete = resolve;
		tx.onerror = reject;
	});
}