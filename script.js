import { processAllChannels } from './js/fileProcessing.js';
import { afficherChannelAleatoire, updateCompteurRestants } from './js/randomChannel.js';
import { garderChannel, supprimerChannel, annulerDerniereAction } from './js/transfer.js';
import { telechargerChannelsToDelete, importerBaseDeDonnees, exporterBaseDeDonnees, supprimerBaseDeDonnees } from './js/db.js';
import { ouvrirSettings, fermerSettings, verifierPremiereConnexion } from './js/popup.js';
import { checkLocalStorageKeyAndRedirect } from './js/redirects.js';


document.addEventListener("DOMContentLoaded", () => {

    verifierPremiereConnexion(); // Vérifie si c'est la première connexion et affiche la popup d'importation si nécessaire
    // document.getElementById('processAllChannels').addEventListener('click', afficherChannelAleatoire);
    document.getElementById('afficherChannelAleatoire').addEventListener('click', afficherChannelAleatoire);
    document.getElementById('garderChannel').addEventListener('click', garderChannel);
    document.getElementById('supprimerChannel').addEventListener('click', supprimerChannel);
    document.getElementById('annulerDerniereAction').addEventListener('click', annulerDerniereAction);
    document.getElementById('telechargerChannelsToDelete').addEventListener('click', telechargerChannelsToDelete);
    document.getElementById('exportButton').addEventListener('click', exporterBaseDeDonnees);
    document.getElementById('deleteDbButton').addEventListener('click', supprimerBaseDeDonnees);
    document.getElementById('settingsButton').addEventListener('click', ouvrirSettings);
    document.getElementById('closeSettings').addEventListener('click', fermerSettings);

    // Bouton d'import - déclenche l'input file caché
    document.getElementById('importButton').addEventListener('click', function () {
        document.getElementById('importFile').click();
    });

    // Gestion de la sélection du fichier
    document.getElementById('importFile').addEventListener('change', async function (event) {
        const statusEl = document.getElementById('importStatus');
        statusEl.textContent = "Importation en cours...";
        statusEl.style.color = "blue";

        try {
            await importerBaseDeDonnees(this);
            statusEl.textContent = "Importation réussie! Rechargement de la page...";
            statusEl.style.color = "green";

            // Recharger la page après un délai court
            setTimeout(() => {
                location.reload();
            }, 1500);
        } catch (error) {
            statusEl.textContent = `Erreur: ${error}`;
            statusEl.style.color = "red";
        }
    });

    window.selectedOption = "DM"; // Valeur par défaut
    updateCompteurRestants();
    afficherChannelAleatoire();
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