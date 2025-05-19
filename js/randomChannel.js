import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";
import { extraireNomChannel, getChannelAvatarPath, getFileExtension } from "./utils.js";

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

        <!-- Section des informations -->
        <div id="infos">
            <div class="avatar">
                <img src="${avatarPath}" alt="Avatar">
            </div>
            <div>
                <h3>${nomChannel}</h3>
                <p>${indexLabel}</p>
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
                    <a href="#" id="loadMoreMessages" class="btn btn-primary mt-3">
                        Voir plus (${restants} messages restants)
                    </a>`;

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
 * Affiche une liste de messages dans l'élément de conversation.
 * Si message.AttachmentURL a une valeur, affiche l'attachement juste en dessous du contenu (si ce dernier existe).
 * @param {Array} messages - Tableau des messages à afficher.
 * @param {HTMLElement} conversationElement - Élément DOM où afficher les messages.
 */
function renderMessages(messages, conversationElement) {
    messages.forEach((message, i) => {
        let messageContent = "";
        if (message.Contents) {
            const parsedContent = marked.parse(message.Contents);
            messageContent = parsedContent.replace(
                /<a /g,
                '<a target="_blank" rel="noopener noreferrer" '
            );
        } else {
            messageContent = "";
        }

        let attachmentHTML = "";
        if (message.Attachments) {
            const attachmentLink = message.Attachments;
            const ext = getFileExtension(attachmentLink); // Utilise la fonction pour récupérer l'extension
            if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) {
                attachmentHTML = `<br><img src="${attachmentLink}" alt="Attachement" style="max-width:100%;display:block;margin-top:8px;">`;
            } else {
                attachmentHTML = `<a href="${attachmentLink}" target="_blank" rel="noopener noreferrer">Télécharger l'attachement</a>`;
            }
        }

        conversationElement.innerHTML += `
            <div>
                <img class="avatarMsg" src="${getChannelAvatarPath(message.channelId)}" alt="Avatar">
                <span>${messageContent}</span>
                ${attachmentHTML}
                <time>${message.Timestamp || "Date inconnue"}</time>
            </div>
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
            <a href="#" id="loadMoreMessages" class="btn btn-primary mt-3">
                Voir plus (${restants} messages restants)
            </a>`;

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