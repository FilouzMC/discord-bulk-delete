import { saveToIndexedDB, STORE_INDEX, STORE_CHANNELS, STORE_MESSAGES } from "./db.js";

// Protège les snowflakes (IDs) en les convertissant en chaînes avant JSON.parse
// Protect snowflake IDs to strings before JSON.parse
function quoteSnowflakeNumbers(jsonText) {
    // 1) Clés connues (insensible à la casse + variantes)
    // 1) Known keys (case-insensitive + variants)
    const keyPattern = /"(id|message_id|messageid|channel_id|channelid|guild_id|guildid|author_id|authorid|user_id|userid|owner_id|ownerid|application_id|applicationid|webhook_id|webhookid)"\s*:\s*(\d{16,})/gi;
    let out = jsonText.replace(keyPattern, '"$1":"$2"');

    // 2) Fallback: toute valeur numérique ≥16 chiffres (ex: IDs non prévus)
    //    Respecte la syntaxe JSON (garde la virgule/fermeture)
    // 2) Fallback: any numeric value ≥16 digits (e.g. unforeseen IDs)
    //    Respect JSON syntax (keep the comma/closing)
    const anyBigNumber = /:\s*(\d{16,})(\s*[,\}])/g;
    out = out.replace(anyBigNumber, ':"$1"$2');

    return out;
}

function safeParse(jsonText) {
    return JSON.parse(quoteSnowflakeNumbers(jsonText));
}

// 📂 Import index.json
document.getElementById('zipInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('status').textContent = "Loading...";

    try {
        const zip = await JSZip.loadAsync(file);

        // 1) messages/index.json
        const jsonFile = zip.file("messages/index.json");
        if (!jsonFile) throw new Error("Files messages/index.json not found !");
        const indexContent = await jsonFile.async("string");
        const indexJson = safeParse(indexContent); // <-- sécurisé
        await saveToIndexedDB(STORE_INDEX, "indexJson", indexJson);

        // 2) account/user.json
        const userFile = zip.file("account/user.json");
        if (!userFile) throw new Error("Files account/user.json not found !");
        const userContent = await userFile.async("string");
        const userJson = safeParse(userContent); // <-- sécurisé

        // Forcer en string
        localStorage.setItem("userId", String(userJson.id));
        localStorage.setItem("username", userJson.username);

        // 3) Avatar (inchangé)
        const possibleExtensions = ["png", "jpg", "gif"];
        for (const ext of possibleExtensions) {
            const f = zip.file(`account/avatar.${ext}`);
            if (f) {
                const avatarBlob = await f.async("base64");
                localStorage.setItem("avatarFileName", `avatar.${ext}`);
                localStorage.setItem("avatarData", avatarBlob);
                break;
            }
        }

        document.getElementById('status').textContent = "Loading... Index + user import successfully !";
    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = "Error : " + error.message;
    }
});

// 📚 Process all channels (channel.json + messages.json)
export async function processAllChannels() {
    try {
        const zipInput = document.getElementById('zipInput');
        const file = zipInput.files[0];
        if (!file) throw new Error("No ZIP file selected.");

        const zip = await JSZip.loadAsync(file);
        const channelFolders = Object.keys(zip.files).filter(p => p.startsWith("messages/c") && p.endsWith("/"));

        for (const folder of channelFolders) {
            localStorage.setItem("totalChannels", channelFolders.length);
            const channelId = folder.match(/c(\d+)\//)[1];

            const channelFile = zip.file(`${folder}channel.json`);
            const messagesFile = zip.file(`${folder}messages.json`);
            if (!channelFile || !messagesFile) continue;

            // Utiliser safeParse pour préserver les snowflakes
            const channelData  = safeParse(await channelFile.async("string"));
            const messagesData = safeParse(await messagesFile.async("string"));

            // Ceinture/bretelles: forcer les IDs en string après parse
            if (Array.isArray(messagesData)) {
                for (const m of messagesData) {
                    if (!m) continue;
                    const id = m.id ?? m.ID ?? m.message_id ?? m.MessageID;
                    if (id != null) m.id = String(id);
                    if (m.channel_id != null) m.channel_id = String(m.channel_id);
                    if (m.author?.id != null) m.author.id = String(m.author.id);
                }
            }

            await saveToIndexedDB(STORE_CHANNELS, String(channelId), channelData);
            await saveToIndexedDB(STORE_MESSAGES, String(channelId), { messages: messagesData });

            // Debug rapide (supprime après vérif)
            if (Array.isArray(messagesData) && messagesData[0]?.id) {
                console.debug('Sample msg id type=', typeof messagesData[0].id, 'value=', messagesData[0].id);
            }
        }

        document.getElementById('status').textContent = "All channels processed successfully! Please wait...";
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = "Error  : " + error.message;
    }
}