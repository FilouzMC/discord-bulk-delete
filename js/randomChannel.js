import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";
import { extraireNomChannel, getChannelAvatarPath } from "./utils.js";

document.getElementById("channelType").addEventListener("change", (event) => {
	window.selectedOption = event.target.value;
	const output = document.getElementById("output");

	// Afficher l'option sélectionnée
	console.log(`Vous avez sélectionné : ${selectedOption}`);
});


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
        const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");
        const indexLabel = indexJson?.[channel.id] || "(non trouvé dans index.json)";
        const nomChannel = extraireNomChannel(indexLabel);
        const avatarPath = getChannelAvatarPath(channel.id);

        // Affichage initial
        output.innerHTML = `
            <div id="main-container">
                <!-- Section de la conversation -->
                <div id="conversation"></div>

                <!-- Section du profil -->
                <div id="output">
                    <div class="avatar">
                        <img src="${avatarPath}" alt="Avatar">
                    </div>
                    <div>
                        <h3>${nomChannel}</h3>
                        <p>Index : ${indexLabel}</p>
                        <p>${msg?.messages.length || 0} messages envoyés</p>
                    </div>
                </div>
            </div>
        `;

        const conversationElement = document.getElementById("conversation");

        if (msg?.messages.length) {
            // Configurer la pagination
            const messagesParPage = 50;
            window.currentMessagePage = 1;
            window.totalMessages = msg.messages.length;

            // Afficher les 50 premiers messages
            const messagesToShow = msg.messages.slice(0, messagesParPage);
            renderMessages(messagesToShow, conversationElement);

            // Afficher le bouton "Voir plus" si nécessaire
            if (msg.messages.length > messagesParPage) {
                const restants = msg.messages.length - messagesParPage;
                conversationElement.innerHTML += `
                    <button id="loadMoreMessages" class="btn btn-primary mt-3">
                        Voir plus (${restants} messages restants)
                    </button>`;

                // Ajouter l'écouteur d'événements après l'insertion du bouton
                setTimeout(() => {
                    document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
                        loadMoreMessages(msg.messages, conversationElement);
                    });
                }, 0);
            }
        } else {
            conversationElement.innerHTML = "<p>Aucun message dans ce channel.</p>";
        }

        await updateCompteurRestants();

    } catch (err) {
        output.textContent = "Erreur lors de l'affichage aléatoire : " + err.message;
    }
}

/**
 * Affiche une liste de messages dans l'élément de conversation
 * @param {Array} messages - Tableau des messages à afficher
 * @param {HTMLElement} conversationElement - Élément DOM où afficher les messages
 */
function renderMessages(messages, conversationElement) {
    messages.forEach((message, i) => {
        conversationElement.innerHTML += `
            <p>
                <img src="${getChannelAvatarPath(message.channelId)}" alt="Avatar">
                <strong>${message.author || "Utilisateur inconnu"}</strong>
                <span>${message.Contents || "[Pièce jointe]"}</span>
                <time>${message.Timestamp || "Date inconnue"}</time>
            </p>
        `;
    });
}

/**
 * Charge davantage de messages quand l'utilisateur clique sur "Voir plus"
 * @param {Array} allMessages - Tableau de tous les messages
 * @param {HTMLElement} conversationElement - Élément DOM où afficher les messages
 */
function loadMoreMessages(allMessages, conversationElement) {
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
    renderMessages(messagesToShow, conversationElement);

    // Mettre à jour la page courante
    window.currentMessagePage = nextPage;

    // Ajouter un nouveau bouton si nécessaire
    const restants = allMessages.length - endIndex;
    if (restants > 0) {
        conversationElement.innerHTML += `
            <button id="loadMoreMessages" class="btn btn-primary mt-3">
                Voir plus (${restants} messages restants)
            </button>`;

        // Réattacher l'écouteur d'événements au nouveau bouton
        setTimeout(() => {
            document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
                loadMoreMessages(allMessages, conversationElement);
            });
        }, 0);
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