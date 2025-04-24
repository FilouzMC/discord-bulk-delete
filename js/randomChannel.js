import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";

// 📜 Affichage d'un channel aléatoire
export async function afficherChannelAleatoire() {
	const output = document.getElementById("outputConv");
	output.textContent = "";

	try {
		const channels = await getAllFromIndexedDB(STORE_CHANNELS);
		const messages = await getAllFromIndexedDB(STORE_MESSAGES);

		if (channels.length === 0) {
			output.textContent = "Aucun channel stocké.";
			return;
		}

		const randomIndex = Math.floor(Math.random() * channels.length);
		const channel = channels[randomIndex];
		window.currentChannelId = channel.id;
		const msg = messages.find(m => m.channelId === channel.id);
		const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");
		const indexLabel = indexJson?.[channel.id] || "(non trouvé dans index.json)";


		output.textContent += `🎲 Channel aléatoire : ${channel.name || "(sans nom)"} [${channel.id}]
Index : ${indexLabel}
Type: ${channel.type}
Guild: ${channel.guild?.name || "aucune"}
Nombre de messages : ${msg?.messages.length || 0}
------------------------------------------\n`;


		if (msg?.messages.length) {
			msg.messages.forEach((message, i) => {
				output.textContent += `#${i + 1} | ${message.Timestamp} | ${message.Contents || "[Pièce jointe]"}\n`;
			});
		} else {
			output.textContent += "\nAucun message dans ce channel.\n";
		}

		const nameChannel = document.getElementById("nameChannel");
		const channelId = document.getElementById("channelId");
		const indexChannel = document.getElementById("indexChannel");
		const nbMessages = document.getElementById("nbMessages");

		if (nameChannel) {
			nameChannel.textContent = `${channel.guild?.name || "aucune"}`;
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
	if (compteur) {
		compteur.textContent = `Channels restants : ${channels.length} / ${total}`;
	}
}