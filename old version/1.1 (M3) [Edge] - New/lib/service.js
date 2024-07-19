chrome.runtime.onStartup.addListener(async () => {
  var a = new Promise(function(resolve, reject){
        chrome.storage.sync.get({"enabled": true}, function(options){
            resolve(options.enabled);
      })
  });

  const enabled = await a;
  console.log(enabled);
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  switch (details.reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
      return chrome.storage.sync.set({
        installDate: Date.now(),
        installVersion: chrome.runtime.getManifest().version,
      });
    case chrome.runtime.OnInstalledReason.UPDATE:
      return chrome.storage.sync.set({
        updateDate: Date.now(),
      });
  }
});

chrome.runtime.onMessage.addListener(async (request, sender) => {
  switch (request.action) {
    case "INSERT_CSS_RULE": {
      return chrome.scripting.insertCSS({
        target: { tabId: sender.tab.id },
        files: [`${request.rule}.css`],
      });
    }
    default:
      throw new Error(`Unknown Action: ${request.action}`);
  }
});


chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace !== "sync") return;

  if (changes.enabled) {
    if (changes.enabled.newValue) {
      await enable();
    } else {
      await disable();
    }
  }

  if (changes.displayActionCountAsBadgeText) {
    await chrome.declarativeNetRequest.setExtensionActionOptions({
      displayActionCountAsBadgeText:
        changes.displayActionCountAsBadgeText.newValue,
    });
  }
});


chrome.webNavigation.onCompleted.addListener(trackVideoView, {
  url: [{ hostSuffix: "youtube.com", pathPrefix: "/watch" }],
});


chrome.webNavigation.onHistoryStateUpdated.addListener(trackVideoView, {
  url: [{ hostSuffix: "youtube.com", pathPrefix: "/watch" }],
});

/**
 * @returns Promise
 */
async function trackVideoView() {
  // const { enabled, videoCount } = await chrome.storage.sync.get({
  //   enabled: true,
  //   videoCount: 0,
  // });
  var a = new Promise(function(resolve, reject){
        chrome.storage.sync.get({"enabled": true}, function(options){
            resolve(options.enabled);
      })
  });

  const enabled = await a;
  console.log(enabled);

  var c = new Promise(function(resolve, reject){
        chrome.storage.sync.get({"videoCount": 0}, function(options){
            resolve(options.videoCount);
        })
  });

  const videoCount = await c;
  console.log(videoCount);

  


  if (!enabled) return;

  await chrome.storage.sync.set({
    videoCount: videoCount + 1,
  });
}

/**
 * Enables this extension core
 * @returns Promise
 */
async function enable() {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["youtube"],
  });
  await chrome.action.setIcon({
    path: {
      16: "data/icons/icon-16.png",
      19: "data/icons/icon-19.png",
      32: "data/icons/icon-32.png",
      38: "data/icons/icon-38.png",
      128: "data/icons/icon-128.png",
    },
  });
  await reloadAffectedTab();
}

/**
 * @returns Promise
 */
async function disable() {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ["youtube"],
  });
  await chrome.action.setIcon({
    path: {
      16: "data/icons/icon-disabled-16.png",
      19: "data/icons/icon-disabled-19.png",
      32: "data/icons/icon-disabled-32.png",
      38: "data/icons/icon-disabled-38.png",
      128: "data/icons/icon-disabled-128.png",
    },
  });
  await reloadAffectedTab();
}

/**
 * @returns Promise
 */
async function reloadAffectedTab() {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    url: "*://*.youtube.com/*",
  });
  const isTabAffected = Boolean(currentTab?.url);
  if (isTabAffected) {
    return chrome.tabs.reload();
  }
}
