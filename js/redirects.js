/**
 * Vérifie si une clé existe dans le localStorage et redirige si nécessaire.
 * @param {string} key - La clé à vérifier dans le localStorage.
 * @param {string} redirectUrl - L'URL vers laquelle rediriger si la clé est absente.
 */
export function checkLocalStorageKeyAndRedirect(key, redirectUrl) {
    if (!localStorage.getItem(key)) {
        window.location.href = redirectUrl;
    }
}