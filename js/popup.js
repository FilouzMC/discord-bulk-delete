// Fonction pour ouvrir la popup
// Function to open the popup
export function ouvrirSettings() {
    const popup = document.getElementById("settingsPopup");
    popup.classList.remove("hiddenSettings");
}

// Fonction pour fermer la popup
// Function to close the popup
export function fermerSettings() {
    const popup = document.getElementById("settingsPopup");
    popup.classList.add("hiddenSettings");
}

// Fonction pour ouvrir la popup d'importation
// Function to open the import popup
export function ouvrirImportPopup() {
    const popup = document.getElementById("importPopup");
    popup.classList.remove("hiddenImport");
}

// Fonction pour fermer la popup d'importation
// Function to close the import popup
export function fermerImportPopup() {
    const popup = document.getElementById("importPopup");
    popup.classList.add("hiddenImport");
}

// Vérifier si c'est la première connexion
// Check if it's the first connection
export function verifierPremiereConnexion() {
    if (!localStorage.getItem("username")) {
        // Si la clé "username" n'existe pas, afficher la popup d'importation
        // If the "username" key does not exist, show the import popup
        ouvrirImportPopup();
    }
}