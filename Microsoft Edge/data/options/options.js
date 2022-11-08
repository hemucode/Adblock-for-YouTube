/**
 *
 * @returns Promise
 */
function translate() {
  return new Promise((resolve) => {
    const elements = document.querySelectorAll("[data-message]");
    for (const element of elements) {
      const key = element.dataset.message;
      const message = chrome.i18n.getMessage(key);
      if (message) {
        element.textContent = message;
      } else {
        console.error("Missing chrome.i18n message:", key);
      }
    }
    resolve();
  });
}

/**
 * @returns Promise
 */
async function hydrate() {
  const options = await chrome.storage.sync.get({
    enabled: true,
    displayVideoBranding: true,
    displayActionCountAsBadgeText: false,
  });

  for (const [key, value] of Object.entries(options)) {
    const $checkbox = document.querySelector(`input[name=${key}]`);
    $checkbox.checked = value;
    $checkbox.addEventListener("change", async (event) => {
      await chrome.storage.sync.set({
        [event.target.name]: event.target.checked,
      });
    });
  }
}

hydrate();
translate();
