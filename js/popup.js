// Fonction pour ouvrir la popup
export function ouvrirSettings() {
    const popup = document.getElementById("settingsPopup");
    popup.classList.remove("hiddenSettings");
}

// Fonction pour fermer la popup
export function fermerSettings() {
    const popup = document.getElementById("settingsPopup");
    popup.classList.add("hiddenSettings");
}

// Fonction pour ouvrir la popup d'importation
export function ouvrirImportPopup() {
    const popup = document.getElementById("importPopup");
    popup.classList.remove("hiddenImport");
}

// Fonction pour fermer la popup d'importation
export function fermerImportPopup() {
    const popup = document.getElementById("importPopup");
    popup.classList.add("hiddenImport");
}

// Vérifier si c'est la première connexion
export function verifierPremiereConnexion() {
    if (!localStorage.getItem("username")) {
        // Si la clé "username" n'existe pas, afficher la popup d'importation
        ouvrirImportPopup();
    }
}