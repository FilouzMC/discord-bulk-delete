import { getAllFromIndexedDB, getItemFromIndexedDB, STORE_CHANNELS, STORE_MESSAGES, STORE_INDEX } from "./db.js";
import { extraireNomChannel, getChannelAvatarPath, getFileExtension } from "./utils.js";

document.getElementById("channelType").addEventListener("change", (event) => {
    window.selectedOption = event.target.value;
    const output = document.getElementById("output");

    // Show selected option in the output
    console.log(`Select : ${selectedOption}`);
    afficherChannelAleatoire();
});


export async function afficherChannelAleatoire() {
    const output = document.getElementById("outputConv");
    output.textContent = "";

    try {
        // Get all channels and messages from IndexedDB
        const channels = await getAllFromIndexedDB(STORE_CHANNELS);
        const messages = await getAllFromIndexedDB(STORE_MESSAGES);

        // Gestion des erreurs : Si aucun channel n'est trouvé
        // Error handling: If no channels are found
        if (channels.length === 0) {
            output.textContent = "No channel stock.";
            return;
        }

        // Random channel en fonction du type sélectionné
        // Random channel based on the selected type
        const filteredChannels = channels.filter(channel => channel.type === window.selectedOption);

        if (filteredChannels.length === 0) {
            output.textContent = `No channel type ${window.selectedOption} found.`;
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredChannels.length);
        const channel = filteredChannels[randomIndex];
        window.currentChannelId = channel.id;

        const msg = messages.find(m => m.channelId === channel.id);
        const indexJson = await getItemFromIndexedDB(STORE_INDEX, "indexJson");
        const indexLabel = indexJson?.[channel.id] || "(no label found)";
        const nomChannel = extraireNomChannel(indexLabel);
        const avatarPath = getChannelAvatarPath(channel.id);

        // Affichage initial
        // Initial display
        output.innerHTML = `
    <div id="main-container">
        <!-- Section of the conversation -->
        <div id="conversation"></div>

        <!-- Section of the informations -->
        <div id="infos">
            <div class="avatar">
                <img src="${avatarPath}" alt="Avatar">
            </div>
            <div>
                <h3>${nomChannel}</h3>
                <p>${channel.id}</p>
                <p>${indexLabel}</p>
                <p>${msg?.messages.length || 0} messages envoyés</p>
            </div>
        </div>
    </div>
`;

        const conversationElement = document.getElementById("conversation");

        if (msg?.messages.length) {
            // Configurer la pagination
            // Set up pagination
            const messagesParPage = 50;
            window.currentMessagePage = 1;
            window.totalMessages = msg.messages.length;

            // Afficher les 50 premiers messages
            // Show the first 50 messages
            const messagesToShow = msg.messages.slice(0, messagesParPage);
            renderMessages(messagesToShow, conversationElement);

            // Afficher le bouton "Voir plus" si nécessaire
            // Show the "See more" button if necessary
            if (msg.messages.length > messagesParPage) {
                const restants = msg.messages.length - messagesParPage;
                conversationElement.innerHTML += `
                    <a href="#" id="loadMoreMessages" class="btn btn-primary mt-3">
                        See more (${restants} messages remaining)
                    </a>`;

                // Ajouter l'écouteur d'événements après l'insertion du bouton
                // Add the event listener after inserting the button
                setTimeout(() => {
                    document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
                        loadMoreMessages(msg.messages, conversationElement);
                    });
                }, 0);
            }
        } else {
            conversationElement.innerHTML = "<p>No message in the channel.</p>";
        }

        await updateCompteurRestants();

    } catch (err) {
        output.textContent = "Error displaying random : " + err.message;
    }
}

/**
 * Renders a list of messages in the conversation element.
 * If message.Attachments has a value, displays the attachment just below the content (if it exists).
 * @param {Array} messages - Array of messages to display.
 * @param {HTMLElement} conversationElement - DOM element where messages will be displayed.
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
            const ext = getFileExtension(attachmentLink); // Get the file extension
            if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) {
                attachmentHTML = `
                <a href="${attachmentLink}" target="_blank" rel="noopener noreferrer">
                    <img src="${attachmentLink}" alt="Attachement" style="max-width:50%;display:block;margin-top:8px;">
                </a>`
            } else {
                attachmentHTML = `<a href="${attachmentLink}" target="_blank" rel="noopener noreferrer">Download the attachement</a>`;
            }
        }

        conversationElement.innerHTML += `
            <div>
                <img class="avatarMsg" src="${getChannelAvatarPath(message.channelId)}" alt="Avatar">
                <span>${messageContent}</span>
                ${attachmentHTML}
                <time>${message.Timestamp || "Unknown date"}</time>
            </div>
        `;
    });
}

/**
 * Loads more messages when the user clicks "See more"
 * @param {Array} allMessages - Array of all messages
 * @param {HTMLElement} conversationElement - DOM element where messages will be displayed  
 * */
function loadMoreMessages(allMessages, conversationElement) {
    const messagesParPage = 50;
    const currentPage = window.currentMessagePage || 1;
    const nextPage = currentPage + 1;

    // Calculer l'index de début et de fin pour cette page
    // Calculate the start and end index for this page
    const startIndex = currentPage * messagesParPage;
    const endIndex = Math.min(startIndex + messagesParPage, allMessages.length);

    // Récupérer les messages à afficher
    // Get the messages to display
    const messagesToShow = allMessages.slice(startIndex, endIndex);

    // Supprimer le bouton actuel
    // Remove the current button
    const currentButton = document.getElementById("loadMoreMessages");
    if (currentButton) {
        currentButton.remove();
    }

    // Ajouter les nouveaux messages
    // Add the new messages
    renderMessages(messagesToShow, conversationElement);

    // Mettre à jour la page courante
    // Update the current page
    window.currentMessagePage = nextPage;

    // Ajouter un nouveau bouton si nécessaire
    // Add a new button if necessary
    const restants = allMessages.length - endIndex;
    if (restants > 0) {
        conversationElement.innerHTML += `
            <a href="#" id="loadMoreMessages" class="btn btn-primary mt-3">
                See more (${restants} messages remaining)
            </a>`;

        // Réattacher l'écouteur d'événements au nouveau bouton
        // Reattach the event listener to the new button
        setTimeout(() => {
            document.getElementById("loadMoreMessages")?.addEventListener("click", () => {
                loadMoreMessages(allMessages, conversationElement);
            });
        }, 0);
    }
}

// 📜 Count
export async function updateCompteurRestants() {
    const channels = await getAllFromIndexedDB(STORE_CHANNELS);
    const total = localStorage.getItem("totalChannels") || "??";
    // Navbar éléments
    const channelsRestantsElement = document.getElementById("channelsRestants");
    const channelsTypeElement = document.getElementById("channelsType");

    if (channelsRestantsElement) {
        channelsRestantsElement.textContent = `Channels remaining : ${channels.length} / ${total}`;
    }

    if (channelsTypeElement && window.selectedOption) {
        const filteredChannels = channels.filter(channel => channel.type === window.selectedOption);
        channelsTypeElement.textContent = `Channels for the type ${window.selectedOption} : ${filteredChannels.length}`;
    }
}