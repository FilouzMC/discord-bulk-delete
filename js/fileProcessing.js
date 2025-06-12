import { saveToIndexedDB, STORE_INDEX, STORE_CHANNELS, STORE_MESSAGES } from "./db.js";

// 📂 Import index.json
document.getElementById('zipInput').addEventListener('change', async function (event) {
	const file = event.target.files[0];
	if (!file) return;

	document.getElementById('status').textContent = "Loading...";

	try {
		const zip = await JSZip.loadAsync(file);

		// === 1. Read messages/index.json ===
		const jsonFile = zip.file("messages/index.json");
		if (!jsonFile) throw new Error("Files messages/index.json not found !");
		const indexContent = await jsonFile.async("string");
		const indexJson = JSON.parse(indexContent);
		await saveToIndexedDB(STORE_INDEX, "indexJson", indexJson);

		// === 2. Read account/user.json ===
		const userFile = zip.file("account/user.json");
		if (!userFile) throw new Error("Files account/user.json not found !");
		const userContent = await userFile.async("string");
		const userJson = JSON.parse(userContent);

		// Save to localStorage
		localStorage.setItem("userId", userJson.id);
		localStorage.setItem("username", userJson.username);

		// === 3. Avatar ===
		const possibleExtensions = ["png", "jpg", "gif"];
		let avatarBlob = null;
		let avatarFileName = "";

		for (const ext of possibleExtensions) {
			const file = zip.file(`account/avatar.${ext}`);
			if (file) {
				avatarBlob = await file.async("base64");
				avatarFileName = `avatar.${ext}`;
				localStorage.setItem("avatarFileName", avatarFileName);
				localStorage.setItem("avatarData", avatarBlob);
				break;
			}
		}

		document.getElementById('status').textContent = "Index + user import successfully !";
	} catch (error) {
		console.error(error);
		document.getElementById('status').textContent = "Error : " + error.message;
	}
});

// 📚 Traitement complet des channels (channel.json + messages.json)
// 📚 Process all channels (channel.json + messages.json)
export async function processAllChannels() {
	try {
		const zipInput = document.getElementById('zipInput');
		const file = zipInput.files[0];
		if (!file) throw new Error("No ZIP file selected.");

		const zip = await JSZip.loadAsync(file);
		const channelFolders = Object.keys(zip.files).filter(path => path.startsWith("messages/c") && path.endsWith("/"));

		for (const folder of channelFolders) {
			localStorage.setItem("totalChannels", channelFolders.length);
			const channelId = folder.match(/c(\d+)\//)[1];

			const channelFile = zip.file(`${folder}channel.json`);
			const messagesFile = zip.file(`${folder}messages.json`);
			if (!channelFile || !messagesFile) continue;

			const channelData = JSON.parse(await channelFile.async("string"));
			const messagesData = JSON.parse(await messagesFile.async("string"));

			await saveToIndexedDB(STORE_CHANNELS, channelId, channelData);
			await saveToIndexedDB(STORE_MESSAGES, channelId, { messages: messagesData });

			console.log(`✅ Channel ${channelId} stocké`);
		}

		document.getElementById('status').textContent = "All channels processed successfully!";
		// Recharger la page après un délai court
		// Reload the page after a short delay
		setTimeout(() => {
			location.reload();
		}, 1500);

	} catch (error) {
		console.error(error);
		document.getElementById('status').textContent = "Error  : " + error.message;
	}
}