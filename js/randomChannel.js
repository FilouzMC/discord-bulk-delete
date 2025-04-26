import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";

document.getElementById("channelType").addEventListener("change", (event) => {
	window.selectedOption = event.target.value;
	const output = document.getElementById("output");

	// Afficher l'option sélectionnée
	console.log(`Vous avez sélectionné : ${selectedOption}`);
});


// 📜 Affichage d'un channel aléatoire
export async function afficherChannelAleatoire() {
	const output = document.getElementById("outputConv");
	output.textContent = "";
	
	try {
		// Récupérer tous les channels et messages depuis IndexedDB
		const channels = await getAllFromIndexedDB(STORE_CHANNELS);
		const messages = await getAllFromIndexedDB(STORE_MESSAGES);
		// Gestion des erreurs : Si aucun channel n'est trouvé
		if (channels.length === 0) {
			output.textContent = "Aucun channel stocké.";
			return;
		}

		// Random channel en fonction du type sélectionné
		const filteredChannels = channels.filter(channel => channel.type === window.selectedOption);

		if (filteredChannels.length === 0) {
			output.textContent = `Aucun channel de type ${window.selectedOption} trouvé.`;
			return;
		}
		

		const randomIndex = Math.floor(Math.random() * filteredChannels.length);
		const channel = filteredChannels[randomIndex];
		window.currentChannelId = channel.id;

		const msg = messages.find(m => m.channelId === channel.id);
		// Recherche dans l'index pour le label
		const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");
		// Variable : Index (ex : "Direct Message with <user>")
		const indexLabel = indexJson?.[channel.id] || "(non trouvé dans index.json)";

		output.innerHTML = `<p>🎲 Channel aléatoire : ${channel.name || "(sans nom)"} [${channel.id}]<br>
Index : ${indexLabel}<br>
Guild: ${channel.guild?.name || "aucune"}<br>
Nombre de messages : ${msg?.messages.length || 0}</p>
<hr>`;

		if (msg?.messages.length) {
			msg.messages.forEach((message, i) => {
				output.innerHTML += `<div class="message" id="message-${i}">${message.Timestamp} ${message.Contents || "[Pièce jointe]"}</div>`;
			});
		} else {
			output.innerHTML += "<p>Aucun message dans ce channel.</p>";
		}

		const nameChannel = document.getElementById("nameChannel");
		const channelId = document.getElementById("channelId");
		const indexChannel = document.getElementById("indexChannel");
		const nbMessages = document.getElementById("nbMessages");

		if (nameChannel) {
			nameChannel.textContent = `${channel.guild?.name || ""}`;
		}
		if (channelId) {
			channelId.textContent = `Channel ID : ${channel.id}`;
		}
		if (indexChannel) {
			indexChannel.textContent = `${indexLabel}`;
		}
		if (nbMessages) {
			nbMessages.textContent = `Nombre de messages : ${msg?.messages.length || 0}`;
		}

		await updateCompteurRestants();

	} catch (err) {
		output.textContent = "Erreur lors de l'affichage aléatoire : " + err.message;
	}
}

// 📜 Compteur
export async function updateCompteurRestants() {
    const channels = await getAllFromIndexedDB(STORE_CHANNELS);
    const total = localStorage.getItem("totalChannels") || "??";
    const compteur = document.getElementById("compteur");
    const typeCompteur = document.getElementById("typeCompteur");

    if (compteur) {
        compteur.textContent = `Channels restants : ${channels.length} / ${total}`;
    }

    if (typeCompteur && window.selectedOption) {
        const filteredChannels = channels.filter(channel => channel.type === window.selectedOption);
        typeCompteur.textContent = `Channels pour le type ${window.selectedOption} : ${filteredChannels.length} / ${filteredChannels.length}`;
    }
}