import { processAllChannels } from './js/fileProcessing.js';
import { afficherChannelAleatoire, updateCompteurRestants } from './js/randomChannel.js';
import { garderChannel, supprimerChannel, annulerDerniereAction } from './js/transfer.js';
import { telechargerChannelsToDelete } from './js/db.js';

document.addEventListener("DOMContentLoaded", () => {

    // document.getElementById('processAllChannels').addEventListener('click', afficherChannelAleatoire);
    document.getElementById('afficherChannelAleatoire').addEventListener('click', afficherChannelAleatoire);
    document.getElementById('garderChannel').addEventListener('click', garderChannel);
    document.getElementById('supprimerChannel').addEventListener('click', supprimerChannel);
    document.getElementById('annulerDerniereAction').addEventListener('click', annulerDerniereAction);
    document.getElementById('telechargerChannelsToDelete').addEventListener('click', telechargerChannelsToDelete);
    // document.getElementById('afficherProfilUtilisateur').addEventListener('click', afficherChannelAleatoire);

    window.selectedOption = "DM"; // Valeur par défaut
    updateCompteurRestants();
});

document.getElementById('zipInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('status').textContent = "Chargement de l'archive...";

    try {
        const zip = await JSZip.loadAsync(file);

        //await processIndexJson(zip);
        //await processUserJson(zip);
        //await processAvatar(zip);
        await processAllChannels(zip);

        document.getElementById('status').textContent = "Tous les fichiers ont été traités avec succès !";
    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = "Erreur : " + error.message;
    }
});