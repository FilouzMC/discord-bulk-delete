// 🌍 Variable
export const DB_NAME = "discordArchiveDB";
export const DB_VERSION = 1;
export const STORE_INDEX = "index";
export const STORE_CHANNELS = "channels";
export const STORE_MESSAGES = "messages";
export const STORE_DELETE = "toDelete";
export const STORE_KEEP = "toKeep";

// 📦 Ouverture ou création de la base de données
// 📦 Open and create the IndexedDB database

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
		request.onerror = () => reject("Error opening DB");
	});
}

// 💾 Sauvegarder dans la DB
// 💾 Save data to IndexedDB
export async function saveToIndexedDB(storeName, key, data) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readwrite");
		const store = tx.objectStore(storeName);
		if (storeName === STORE_INDEX) {
			store.put(data, key);
		} else {
			// Inject the key as a unique field for keyPath
			if (storeName === STORE_CHANNELS) data.id = key;
			if (storeName === STORE_MESSAGES) data.channelId = key;
			store.put(data);
		}
		tx.oncomplete = resolve;
		tx.onerror = () => reject("Error saving to DB");
	});
}

// 📥 Charger tous les éléments d’un store
// 📥 Load all items from a store in IndexedDB
export async function getAllFromIndexedDB(storeName) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readwrite");
		const store = tx.objectStore(storeName);
		const req = store.getAll();
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject("Error read DB");
	});
}

// 📜 Affichage de l'intitulé du salon grâce au index.json
// 📜 Display the channel title using index.json
export async function getItemFromIndexedDB(storeName, key) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, "readonly");
		const store = tx.objectStore(storeName);
		const request = store.get(key);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject("Error read item");
	});
}

// 📥 Exporter les channels à supprimer en format texte
// 📥 Export channels to delete in text format
export async function telechargerChannelsToDelete() {
	const db = await openDB();
	const tx = db.transaction(STORE_DELETE, "readonly");
	const store = tx.objectStore(STORE_DELETE);

	const request = store.getAll();

	request.onsuccess = () => {
		const entries = request.result;
		if (!entries.length) {
			alert("No channels in the delete list!");
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
// 📤 Export the entire database and localStorage to a JSON file
export async function exporterBaseDeDonnees() {
	try {
		// Récupérer les données de chaque store IndexedDB
		// Get data from each IndexedDB store
		const index = await getAllFromIndexedDB(STORE_INDEX);
		const channels = await getAllFromIndexedDB(STORE_CHANNELS);
		const messages = await getAllFromIndexedDB(STORE_MESSAGES);
		const toDelete = await getAllFromIndexedDB(STORE_DELETE);
		const toKeep = await getAllFromIndexedDB(STORE_KEEP);

		// Récupérer l'index spécifique "indexJson"
		// Get the specific index "indexJson"
		const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");

		// Récupérer tout le localStorage
		// Get all localStorage data
		const localStorageData = {};
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			let value = localStorage.getItem(key);

			// Essayer de parser les valeurs JSON si possible
			// Try to parse JSON values if possible
			try {
				value = JSON.parse(value);
			} catch (e) {
				// Si ce n'est pas du JSON, garder la valeur string
				// If it's not JSON, keep the string value
			}

			localStorageData[key] = value;
		}

		// Créer l'objet de sauvegarde
		// Create the backup object
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
		// Convert to JSON and create a blob
		const jsonData = JSON.stringify(backup, null, 2);
		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		// Télécharger le fichier
		// Download the file
		const a = document.createElement("a");
		const date = new Date().toISOString().split('T')[0];
		a.href = url;
		a.download = `discord_backup_${date}.json`;
		a.click();

		URL.revokeObjectURL(url);
		return true;
	} catch (error) {
		console.error("Error while exporting :", error);
		return false;
	}
}

// 📥 Importer une base de données depuis un fichier JSON
// 📥 Import a database from a JSON file
export async function importerBaseDeDonnees(fileInputElement) {
	return new Promise((resolve, reject) => {
		if (!fileInputElement.files || fileInputElement.files.length === 0) {
			reject("No file select");
			return;
		}

		const file = fileInputElement.files[0];
		if (!file.type.match('application/json')) {
			reject("The file must be in JSON file");
			return;
		}

		const reader = new FileReader();

		reader.onload = async (event) => {
			try {
				const data = JSON.parse(event.target.result);

				// Vérifier la structure du fichier
				// Check the file structure
				if (!data.version || !data.data) {
					reject("File backup format invalid");
					return;
				}

				// Importer les données IndexedDB
				// Import IndexedDB data
				if (data.data.indexedDB) {
					await importerDonneesIndexedDB(data.data.indexedDB);
				}

				// Importer les données localStorage
				// Import localStorage data
				if (data.data.localStorage) {
					importerLocalStorage(data.data.localStorage);
				}

				resolve(true);
			} catch (error) {
				reject(`Error while importing: ${error.message}`);
			}
		};

		reader.onerror = () => reject("Error while reading of the file");
		reader.readAsText(file);
	});
}

// 🔄 Importer les données dans IndexedDB
// 🔄 Import data into IndexedDB
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
// 📝 Import data into localStorage
function importerLocalStorage(data) {
	// Optionnel: remove the existant localStorage
	// localStorage.clear();

	// Import data into localStorage
	for (const key in data) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			let value = data[key];

			// Convertir en chaîne si c'est un objet ou un tableau
			// Convert to string if it's an object or array
			if (typeof value === 'object' && value !== null) {
				value = JSON.stringify(value);
			}

			localStorage.setItem(key, value);
		}
	}
}

// 🧰 Fonction utilitaire pour importer un store
// 🧰 Utility function to import a store
async function importerStore(items, storeName) {
	if (!items || !Array.isArray(items)) return;

	const db = await openDB();
	const tx = db.transaction(storeName, "readwrite");
	const store = tx.objectStore(storeName);

	for (const item of items) {
		if (item) {
			// Déterminer la clé en fonction du store
			// Determine the key based on the store
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

// 🗑️ Supprimer la base de données IndexedDB et le localStorage
// 🗑️ Delete IndexedDB and localStorage
export async function supprimerBaseDeDonnees() {
    // Afficher une alerte de confirmation
	// Show a confirmation alert
    const confirmation = confirm(
        "Are you sure you want to delete all data (IndexedDB and localStorage)? This action is irreversible."
    );

    if (!confirmation) {
        alert("Action cancelled. No data was deleted.");
        return;
    }

    try {
        // Effacer le contenu de l'élément de sortie
		// Clear the content of the output element
        const output = document.getElementById("outputConv");
        if (output) output.textContent = "";

        // Ouvrir la base de données pour la fermer
		// Open the database to close it
        const db = await openDB();
        db.close(); // Fermer la connexion à la base de données
        console.log("DB closed successfully.");

        // Supprimer localStorage
		// Delete localStorage
        localStorage.clear();
        console.log("localStorage deleted successfully.");

        // Réessayer de supprimer IndexedDB jusqu'à 10 fois
		// Retry deleting IndexedDB up to 10 times
        const maxRetries = 10;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            attempt++;
            console.log(`Try ${attempt} to delete IndexedDB...`);

            success = await new Promise((resolve) => {
                const request = indexedDB.deleteDatabase(DB_NAME);

                request.onsuccess = () => {
                    console.log("IndexedDB deleted successfully.");
                    resolve(true);
                };

                request.onerror = (e) => {
                    console.error("Error while deleting IndexedDB :", e);
                    resolve(false);
                };

                request.onblocked = (e) => {
                    console.warn("The IndexedDB is blocked. Please close all tabs using this database.");
                    console.warn(e);
                    resolve(false);
                };
            });

            if (!success) {
                console.log("New try in 1 second...");
                await new Promise((r) => setTimeout(r, 1000)); // Attendre 1 seconde avant de réessayer
            }
        }

        if (success) {
            console.log("The database (IndexedDB and localStorage) has been successfully deleted.");
            setTimeout(() => {
                // Refresh the page
                location.reload(true);
            }, 1000);
        } else {
            alert(
                "Failed to delete IndexedDB after multiple attempts. Please close all tabs using this database."
            );
        }
    } catch (error) {
        console.error("Error deleting database:", error);
		alert("An error occurred while deleting the database.");
    }
}