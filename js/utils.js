/**
 * Gets a meaningful name for a channel from its indexLabel
 * @param {*} indexLabel 
 * @returns 
 */
export function extraireNomChannel(indexLabel) {
	// Si l'indexLabel n'existe pas
	if (!indexLabel || indexLabel === "(non trouvé dans index.json)") {
		return "Inconnu";
	}

	// Cas 1: Channel dans un serveur (format "something in ServerName")
	if (indexLabel.includes(" in ")) {
		const match = indexLabel.match(/.*? in (.*)/);
		return match ? match[1] : indexLabel;
	}

	// Cas 2: Message direct avec un utilisateur
	if (indexLabel.startsWith("Direct Message with ")) {
		const match = indexLabel.match(/Direct Message with (.*)/);
		return match ? match[1] : indexLabel;
	}

	// Cas 3: Groupe sans nom
	if (indexLabel === "None") {
		return "No Name Group";
	}

	// Cas 4: Groupe avec nom ou autres cas
	return indexLabel;
}

/**
 * Generates a avatar path based on the channel ID
 * @param {*} channelId 
 * @param {*} totalAvatars 
 * @returns 
 */
export function getChannelAvatarPath(channelId, totalAvatars = 5) {
	// Vérifier si l'ID existe, utiliser le premier avatar comme fallback
	if (!channelId) return "/img/avatars/1.png";

	// Convertir l'ID en nombre entier pour en faire une seed
	let numericId = 0;
	for (let i = 0; i < channelId.length; i++) {
		numericId += channelId.charCodeAt(i);
	}

	// Appliquer un modulo pour avoir un nombre entre 1 et totalAvatars
	const avatarNumber = (numericId % totalAvatars) + 1;

	// Retourner le chemin complet
	return `/img/avatars/${avatarNumber}.png`;
}

/**
 * Function to retrieve the Discord user profile
 * @param {*} userId 
 * @returns 
 */
export async function getUserProfile(userId) {
	const url = `https://discord.com/api/v10/users/${userId}`;

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bot ${process.env.DISCORD_TOKEN}`, // Utiliser le token
			},
		});

		if (!response.ok) {
			throw new Error(`Erreur HTTP : ${response.status}`);
		}

		const userData = await response.json();
		console.log("Données utilisateur :", userData);
		return userData;
	} catch (error) {
		console.error("Erreur lors de la récupération des données utilisateur :", error);
	}
}

// Function to get the file extension from a URL
export function getFileExtension(url) {
    // Utilise une expression régulière pour capturer l'extension avant les paramètres
    const match = url.match(/\.([a-zA-Z0-9]+)(?=\?|#|$)/);
    return match ? match[1].toLowerCase() : null; // Retourne l'extension en minuscule ou null si aucune extension trouvée
}

// Function to get the avatar data URL from localStorage
export function getAvatarDataUrlFromLocalStorage() {
	const avatarFileName = localStorage.getItem("avatarFileName");
	const avatarData = localStorage.getItem("avatarData");

	if (avatarFileName && avatarData) {
		return `data:image/${getFileExtension(avatarFileName)};base64,${avatarData}`;
	}
	return null; // Retourne null si aucune donnée d'avatar n'est trouvée
}

let _recipientCopyInit = false;

/**
 * Initialise (une seule fois) la copie d'ID pour les recipients.
 * - Clic sur .recipient-copy-btn => copie l'ID (data-copy)
 * - Clic sur .recipient-item => copie l'ID (data-user-id) si pas déjà sur le bouton
 */
export function initRecipientCopyListener() {
    if (_recipientCopyInit) return;
    _recipientCopyInit = true;

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.recipient-copy-btn');
        const item = btn ? null : e.target.closest('.recipient-item');
        const idToCopy = btn?.getAttribute('data-copy') || item?.dataset.userId;
        if (!idToCopy) return;

        const target = btn || item;

        const ok = await copyText(idToCopy);
        if (!ok) {
            alert("Impossible de copier l'ID");
            return;
        }

        const originalHTML = btn ? btn.innerHTML : null;
        target.classList.add('copied');
        if (btn) btn.textContent = "✔";
        setTimeout(() => {
            target.classList.remove('copied');
            if (btn) btn.innerHTML = originalHTML;
        }, 1200);
    });
}

/**
 * Copie texte (navigator.clipboard fallback textarea)
 */
export async function copyText(text) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch {
        return false;
    }
}