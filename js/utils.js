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
		return "Groupe sans nom";
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