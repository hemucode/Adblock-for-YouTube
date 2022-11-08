/**
 * @returns Promise
 */
async function init() {
  return Promise.all([translate(), hydrate()]);
}

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
  // Get settings
  const { enabled, videoCount } = await chrome.storage.sync.get({
    enabled: true,
    videoCount: 0,
  });

  // Hydrate Logo
  const $logo = document.querySelector(".logo");
  $logo.style.filter = enabled ? "grayscale(0)" : "grayscale(100%)";
  $logo.style.opacity = enabled ? "1" : "0.7";

  // Hydrate Timesave info
  const $timeSaveInfo = document.querySelector(".timesave-info");
  const adTimePerVideo = 0.5;
  const timeSaved = Math.ceil(videoCount * adTimePerVideo);
  $timeSaveInfo.textContent = chrome.i18n.getMessage("timesaveInfo", [
    new Intl.NumberFormat(undefined, {
      style: "unit",
      unit: "minute",
      unitDisplay: "long",
    }).format(timeSaved),
  ]);

  // Hydrate Checkbox Label
  const $checkboxLabel = document.querySelector("[data-message=enabled]");
  $checkboxLabel.textContent = chrome.i18n.getMessage(
    enabled ? "enabled" : "disabled"
  );

  // Hydrate Checkbox Label
  const $enabledCheckbox = document.querySelector("input[name=enabled]");
  $enabledCheckbox.checked = enabled;
  $enabledCheckbox.addEventListener("change", async (event) => {
    const enabled = event.currentTarget.checked;

    // Persist
    await chrome.storage.sync.set({ enabled });

    // Update Checkbox Label
    $checkboxLabel.textContent = chrome.i18n.getMessage(
      enabled ? "enabled" : "disabled"
    );

    // Update Logo
    $logo.style.filter = enabled ? "grayscale(0)" : "grayscale(100%)";
    $logo.style.opacity = enabled ? "1" : "0.7";
  });
}

init();
