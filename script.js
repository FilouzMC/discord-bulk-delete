import { processAllChannels } from './js/fileProcessing.js';
import { afficherChannelAleatoire, updateCompteurRestants } from './js/randomChannel.js';
import { garderChannel, supprimerChannel, annulerDerniereAction } from './js/transfer.js';
import { telechargerChannelsToDelete, exporterBaseDeDonnees, supprimerBaseDeDonnees, importerBaseDeDonnees } from './js/db.js';
import { verifierPremiereConnexion, ouvrirSettings, fermerSettings } from './js/popup.js';
import { initShortcuts, updateShortcut, resetShortcuts, getShortcutConfig, hydrateShortcutInputs, displayKey, flashMessage} from './js/shortcuts.js';

const DEFAULT_SHORTCUTS = {
    random: ' ',
    keep: 'c',
    delete: 's',
    undo: 'w',
    export: 'e'
};

document.addEventListener("DOMContentLoaded", () => {
    verifierPremiereConnexion();

    document.getElementById('afficherChannelAleatoire')?.addEventListener('click', afficherChannelAleatoire);
    document.getElementById('garderChannel')?.addEventListener('click', garderChannel);
    document.getElementById('supprimerChannel')?.addEventListener('click', supprimerChannel);
    document.getElementById('annulerDerniereAction')?.addEventListener('click', annulerDerniereAction);
    document.getElementById('telechargerChannelsToDelete')?.addEventListener('click', telechargerChannelsToDelete);
    document.getElementById('exportButton')?.addEventListener('click', exporterBaseDeDonnees);
    document.getElementById('deleteDbButton')?.addEventListener('click', supprimerBaseDeDonnees);
    document.getElementById('settingsButton')?.addEventListener('click', ouvrirSettings);
    document.getElementById('closeSettings')?.addEventListener('click', fermerSettings);

    document.getElementById('importButton')?.addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile')?.addEventListener('change', async function () {
        const statusEl = document.getElementById('importStatus');
        statusEl.textContent = "Importing... Please wait...";
        statusEl.style.color = "blue";
        try {
            await supprimerBaseDeDonnees();
            await importerBaseDeDonnees(this);
            statusEl.textContent = "Import success ! Reloading...";
            statusEl.style.color = "green";
            setTimeout(() => location.reload(), 1200);
        } catch (error) {
            statusEl.textContent = `Error: ${error}`;
            statusEl.style.color = "red";
        }
    });

    // Init raccourcis
    initShortcuts(
        {
            random: { fn: afficherChannelAleatoire, label: 'Random', color: '#E7AA00' },
            keep:   { fn: garderChannel,           label: 'Keep',   color: '#3498db' },
            delete: { fn: supprimerChannel,        label: 'Delete', color: '#e74c3c' },
            undo:   { fn: annulerDerniereAction,   label: 'Undo',   color: '#7f8c8d' }        },
        DEFAULT_SHORTCUTS
    );

    // Remplir inputs existants avec la config actuelle
    hydrateShortcutInputs();

    // Gestion dynamique des inputs
    document.querySelectorAll('.shortcut-input').forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            e.preventDefault();
            let key = e.key;
            if (key === 'Tab' || key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') return;
            if (key === 'Escape') {
                inp.blur();
                return;
            }
            // Normalisation
            if (key === ' ') key = ' ';
            if (key.length === 1) key = key.toLowerCase();

            const action = inp.dataset.action;
            const ok = updateShortcut(action, key);
            if (!ok) {
                // Conflit
                inp.classList.add('invalid');
                flashMessage(inp, 'Conflict');
                return;
            }
            inp.classList.remove('invalid');
            inp.value = displayKey(key);
        });
        // Empêche saisie directe texte
        inp.addEventListener('input', () => {
            inp.value = '';
        });
        inp.addEventListener('focus', () => {
            inp.select();
        });
    });

    document.getElementById('resetShortcuts')?.addEventListener('click', () => {
        resetShortcuts(DEFAULT_SHORTCUTS);
        hydrateShortcutInputs();
    });

    window.selectedOption = "DM";
    updateCompteurRestants();
    afficherChannelAleatoire();
});

document.getElementById('zipInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('status').textContent = "Please wait...";

    try {
        const zip = await JSZip.loadAsync(file);

        //await processIndexJson(zip);
        //await processUserJson(zip);
        //await processAvatar(zip);
        await processAllChannels(zip);

        document.getElementById('status').textContent = "All files have been processed successfully!";
    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = "Error: " + error.message;
    }
});