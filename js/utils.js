/**
 * Extrait le nom significatif d'un channel à partir de son indexLabel
 * @param {string} indexLabel - Label du channel depuis indexJson
 * @returns {string} - Nom extrait du channel
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
 * Génère un chemin d'avatar basé sur l'ID du channel
 * @param {string} channelId - ID du channel Discord
 * @param {number} totalAvatars - Nombre total d'avatars disponibles (par défaut: 10)
 * @returns {string} - Chemin vers l'image de l'avatar
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

