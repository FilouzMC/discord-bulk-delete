/**
 * Checks if a key exists in localStorage and redirects if necessary.
 * @param {*} key - The key to check in localStorage.
 * @param {*} redirectUrl - The URL to redirect to if the key is absent.
 */
export function checkLocalStorageKeyAndRedirect(key, redirectUrl) {
    if (!localStorage.getItem(key)) {
        window.location.href = redirectUrl;
    }
}