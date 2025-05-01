import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";
import { extraireNomChannel, getChannelAvatarPath } from "./utils.js";

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
		// Variable : Nom du channel (ex : "Nom du channel dans le serveur")
		const nomChannel = extraireNomChannel(indexLabel);
		// Avatar du channel
		const avatarPath = getChannelAvatarPath(channel.id);

		output.innerHTML = `<pre>🎲 Channel aléatoire : ${channel.name || "(sans nom)"} [${channel.id}]<br>
Nom : ${nomChannel}<br>
Avatar : <img src="${avatarPath}" alt="Avatar" width="50" height="50"><br>
Index : ${indexLabel}<br>
Guild: ${channel.guild?.name || "aucune"}<br>
Nombre de messages : ${msg?.messages.length || 0}</pre>
<hr>`;

		if (msg?.messages.length) {
			// Configurer la pagination
			const messagesParPage = 50; // Nombre de messages à afficher par page
			window.currentMessagePage = 1;
			window.totalMessages = msg.messages.length;

			// Afficher les 50 premiers messages
			const messagesToShow = msg.messages.slice(0, messagesParPage);
			messagesToShow.forEach((message, i) => {
				output.innerHTML += `<div class="message" id="message-${i}">${message.Timestamp} ${message.Contents || "[Pièce jointe]"}</div>`;
			});

			// Afficher le bouton "Voir plus" si nécessaire
			if (msg.messages.length > messagesParPage) {
				const restants = msg.messages.length - messagesParPage;
				output.innerHTML += `
            <button id="loadMoreMessages" class="btn btn-primary mt-3">
                Voir plus (${restants} messages restants)
            </button>`;

				// Ajouter l'écouteur d'événements après l'insertion du bouton
				setTimeout(() => {
					document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
						loadMoreMessages(msg.messages, output);
					});
				}, 0);
			}
		} else {
			output.innerHTML += "<p>Aucun message dans ce channel.</p>";
		}

		// const nameChannel = document.getElementById("nameChannel");
		// const channelId = document.getElementById("channelId");
		// const indexChannel = document.getElementById("indexChannel");
		// const nbMessages = document.getElementById("nbMessages");

		// if (nameChannel) {
		// 	nameChannel.textContent = `${channel.guild?.name || ""}`;
		// }
		// if (channelId) {
		// 	channelId.textContent = `Channel ID : ${channel.id}`;
		// }
		// if (indexChannel) {
		// 	indexChannel.textContent = `${indexLabel}`;
		// }
		// if (nbMessages) {
		// 	nbMessages.textContent = `Nombre de messages : ${msg?.messages.length || 0}`;
		// }

		await updateCompteurRestants();

	} catch (err) {
		output.textContent = "Erreur lors de l'affichage aléatoire : " + err.message;
	}
}

// 📜 Compteur
export async function updateCompteurRestants() {
	const channels = await getAllFromIndexedDB(STORE_CHANNELS);
	const total = localStorage.getItem("totalChannels") || "??";
	// Navbar éléments
	const channelsRestantsElement = document.getElementById("channelsRestants");
	const channelsTypeElement = document.getElementById("channelsType");

	if (channelsRestantsElement) {
		channelsRestantsElement.textContent = `Channels restant : ${channels.length} / ${total}`;
	}

	if (channelsTypeElement && window.selectedOption) {
		const filteredChannels = channels.filter(channel => channel.type === window.selectedOption);
		channelsTypeElement.textContent = `Channels pour le type ${window.selectedOption} : ${filteredChannels.length} / ${filteredChannels.length}`;
	}
}

/**
 * Charge davantage de messages quand l'utilisateur clique sur "Voir plus"
 * @param {Array} allMessages - Tableau de tous les messages
 * @param {HTMLElement} outputElement - Élément DOM où afficher les messages
 */
function loadMoreMessages(allMessages, outputElement) {
	const messagesParPage = 50;
	const currentPage = window.currentMessagePage || 1;
	const nextPage = currentPage + 1;

	// Calculer l'index de début et de fin pour cette page
	const startIndex = currentPage * messagesParPage;
	const endIndex = Math.min(startIndex + messagesParPage, allMessages.length);

	// Récupérer les messages à afficher
	const messagesToShow = allMessages.slice(startIndex, endIndex);

	// Supprimer le bouton actuel
	const currentButton = document.getElementById("loadMoreMessages");
	if (currentButton) {
		currentButton.remove();
	}

	// Ajouter les nouveaux messages
	messagesToShow.forEach((message, i) => {
		const globalIndex = startIndex + i;
		outputElement.innerHTML += `<div class="message" id="message-${globalIndex}">${message.Timestamp} ${message.Contents || "[Pièce jointe]"}</div>`;
	});

	// Mettre à jour la page courante
	window.currentMessagePage = nextPage;

	// Ajouter un nouveau bouton si nécessaire
	const restants = allMessages.length - endIndex;
	if (restants > 0) {
		outputElement.innerHTML += `
            <button id="loadMoreMessages" class="btn btn-primary mt-3">
                Voir plus (${restants} messages restants)
            </button>`;

		// Réattacher l'écouteur d'événements au nouveau bouton
		setTimeout(() => {
			document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
				loadMoreMessages(allMessages, outputElement);
			});
		}, 0);
	}
}