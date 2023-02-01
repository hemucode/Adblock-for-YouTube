/**
 * By @Codehemu - https://raw.githubusercontent.com/hemucode/Adblock-for-YouTube/main/Microsoft%20Edge/bundled-content-script.js ( JS: MIT License)
 * License - https://github.com/hemucode/Adblock-for-YouTube/blob/main/LICENSE ( CSS: MIT License)
 */
async function init() {
  try {
    var a = new Promise(function(resolve, reject){
          chrome.storage.sync.get({"enabled": true}, function(options){
              resolve(options.enabled);
          })
      });

    const enabled = await a;
    // console.log(enabled);
    

    var b = new Promise(function(resolve, reject){
          chrome.storage.sync.get({"displayVideoBranding": true}, function(options){
              resolve(options.displayVideoBranding);
          })
      });

    const displayVideoBranding = await b;
    // console.log(displayVideoBranding);

    var c = new Promise(function(resolve, reject){
          chrome.storage.sync.get({"videoCount": 0}, function(options){
              resolve(options.videoCount);
          })
      });

    const videoCount = await c;
    // console.log(videoCount);

    var d = new Promise(function(resolve, reject){
          chrome.storage.sync.get({"videoCount": 21}, function(options){
              resolve(options.videoCount);
          })
    });

    const nextRatingRequest = await d;
    // console.log(nextRatingRequest);

      
    if (
      window.location.href === "https://www.youtube.com/" &&
      nextRatingRequest &&
      videoCount > nextRatingRequest
    ) {
      setTimeout(() => {
        createRatingQuestion(videoCount);
      }, 2000);
    }

    if (!enabled) return;
    console.log(`[Video Ads Blocker for Youtube™ v${chrome.runtime.getManifest().version} Enabled]`);
    console.log(chrome.i18n.getMessage("videoBranding") +` https://chrome.google.com/webstore/detail/${chrome.runtime.id}`)

    // console.log("videoCount");

    if (displayVideoBranding) {
      onVideoElementMutation(appendVideoIndicator);
    }

    await Promise.all([injectStyles(), injectMainScript("lib/scriptlets.js")]);

    /**
    * @returns Promise
    */

  }
  catch(err) {
    console.log(err.message);
  }
 
}
init();

/**
 * @returns Promise
 */
function injectStyles() {
  return chrome.runtime.sendMessage({
    action: "INSERT_CSS_RULE",
    rule: "content-style",
  });
}

/**
 * @returns Promise
 */
function injectMainScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(src);
    script.onload = function () {
      this.remove();
      resolve();
    };
    script.onerror = reject;
    (document.head || document.documentElement).appendChild(script);
  });
}

async function waitForDOMReady() {
  return new Promise((resolve) => {
    switch (document.readyState) {
      case "interactive":
      case "complete": {
        return resolve();
      }
      case "loading": {
        document.onreadystatechange = () => resolve();
      }
    }
  });
}

async function onVideoElementMutation(callback) {
  await waitForDOMReady();

  const tagName = "YTD-PLAYER";
  const videoNode = document.getElementsByTagName(tagName)?.[0];
  if (videoNode) {
    callback(videoNode);
  }
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        if (mutation.target.nodeName === "YTD-PLAYER") {
          callback(mutation.target);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
  };
}

function appendVideoIndicator(target) {
  if (target.querySelector(".adblock-for-youtube-branding")) {
    return;
  }

  target.style.position = "relative";

  const wrapper = document.createElement("div");
  // Styles
  wrapper.style.display = "inline-block";
  wrapper.style.position = "absolute";
  wrapper.style.bottom = "-13px";
  wrapper.style.fontSize = "10px";
  wrapper.style.letterSpacing = "0.06rem";
  wrapper.style.opacity = 0.9;
  wrapper.style.right = 0;
  target.appendChild(wrapper);

  // Create Element
  const anchor = document.createElement("a");
  anchor.className = "adblock-for-youtube-branding yt-formatted-string";
  anchor.href = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`;
  anchor.textContent = chrome.i18n.getMessage("videoBranding");
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.style.textDecoration = "none";
  anchor.style.color = "var(--yt-spec-text-secondary)";
  wrapper.appendChild(anchor);

  const dash = document.createTextNode(" - ");
  wrapper.appendChild(dash);

  const shareButton = document.createElement("button");
  shareButton.textContent = chrome.i18n.getMessage("recommend") || "Recommend";
  shareButton.style.fontSize = "10px";
  shareButton.style.border = "none";
  shareButton.style.cursor = "pointer";
  shareButton.style.color = "var(--yt-spec-static-brand-white, white)";
  shareButton.style.background =
    "var(--yt-spec-brand-button-background, rgb(204, 0, 0))";

  shareButton.style.borderBottomLeftRadius = "3px";
  shareButton.onclick = (event) => {
    event.preventDefault();
    return navigator.share({
      title: chrome.i18n.getMessage("extensionName"),
      text: chrome.i18n.getMessage("extensionDescription"),
      url: `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`,
    });
  };

  wrapper.appendChild(shareButton);
}

function createDialog() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.zIndex = 9999;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "#00000099";
  overlay.style.opacity = 1;
  overlay.style.transition = "opacity 1s ease";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "flex-start";

  function handleOverlayClick(event) {
    if (event.target === overlay) {
      return handleClose(event);
    }
  }

  function handleKeydown(event) {
    if (event.code === "Escape") {
      return handleClose(event);
    }
  }

  function handleClose(event) {
    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.parentElement.removeChild(overlay);
    }, 300);

    overlay.removeEventListener("click", handleOverlayClick);
    closeButton.removeEventListener("click", handleClose);
    window.removeEventListener("keypress", handleKeydown);
  }

  overlay.addEventListener("click", handleOverlayClick);
  window.addEventListener("keydown", handleKeydown);

  document.body.appendChild(overlay);

  const dialog = document.createElement("dialog");
  dialog.open = true;
  dialog.style.width = "300px";
  dialog.style.minHeight = "50px";
  dialog.style.border = "none";
  dialog.style.overflow = "auto";
  dialog.style.padding = "16px";
  dialog.style.marginTop = "48px";
  dialog.style.boxSizing = "border-box";
  dialog.style.maxHeight = "100%";
  dialog.style.boxShadow = "1px 1px 10px 0 #00000099";
  dialog.style.borderRadius = "2px";
  overlay.appendChild(dialog);

  const closeButton = document.createElement("button");
  closeButton["aria-label"] = "Cancel";
  closeButton.style.verticalAlign = "middle";
  closeButton.style.color = "inherit";
  closeButton.style.outline = "none";
  closeButton.style.background = "none";
  closeButton.style.float = "right";
  closeButton.style.margin = "0";
  closeButton.style.border = "none";
  closeButton.style.padding = "0";
  closeButton.style.width = "26px";
  closeButton.style.height = "26px";
  closeButton.style.lineHeight = "0";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", handleClose);
  dialog.appendChild(closeButton);

  const closeIcon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  closeIcon.setAttribute("viewBox", "0 0 24 24");
  closeIcon.focusable = false;
  closeButton.appendChild(closeIcon);

  const closePath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  closePath.setAttribute(
    "d",
    "M12.7,12l6.6,6.6l-0.7,0.7L12,12.7l-6.6,6.6l-0.7-0.7l6.6-6.6L4.6,5.4l0.7-0.7l6.6,6.6l6.6-6.6l0.7,0.7L12.7,12z"
  );
  closeIcon.appendChild(closePath);

  const header = document.createElement("h2");
  header.style.padding = "0 36px 16px 0px";
  header.style.fontSize = "var(--ytd-subheadline-font-size)";
  header.style.fontWeight = "var(--ytd-subheadline-font-weight)";
  header.style.lineHeight = "var(--ytd-subheadline-line-height)";
  header.style.letterSpacing = "var(--ytd-subheadline-letter-spacing)";
  dialog.appendChild(header);

  const content = document.createElement("div");
  dialog.appendChild(content);

  return {
    close: handleClose,
    overlay,
    dialog,
    header,
    content,
  };
}

function createRatingQuestion(videoCount) {
  if (window !== window.top) return;
  const { close, header, content } = createDialog();

  const adTimePerVideo = 0.5;
  const timeSaved = Math.ceil(videoCount * adTimePerVideo);

  header.textContent = chrome.i18n.getMessage("timesaveInfo", [
    new Intl.NumberFormat(undefined, {
      style: "unit",
      unit: "minute",
      unitDisplay: "long",
    }).format(timeSaved),
  ]);

  const reviewButton = document.createElement("a");
  reviewButton.href = `https://chrome.google.com/webstore/detail/${chrome.runtime.id}`;
  reviewButton.target = "_blank";
  reviewButton.rel = "noopener";
  reviewButton.style.backgroundColor = "var(--yt-spec-badge-chip-background)";
  reviewButton.style.textTransform = "uppercase";
  reviewButton.style.color = "var(--yt-spec-text-primary)";
  reviewButton.style.display = "block";
  reviewButton.style.textDecoration = "none";
  reviewButton.style.whiteSpace = "pre";
  reviewButton.style.marginRight = "4px";
  reviewButton.style.marginBottom = "4px";
  reviewButton.style.fontSize = "14px";
  reviewButton.style.border = "1px solid var(--yt-spec-10-percent-layer)";
  reviewButton.style.width = "100%";
  reviewButton.style.borderRadius = "2px";
  reviewButton.style.padding = "10px 16px 10px 28px";
  reviewButton.style.textIndent = "-17px";
  reviewButton.style.boxSizing = "border-box";
  reviewButton.style.whiteSpace = "normal";
  reviewButton.style.textAlign = "left";
  reviewButton.textContent = `❤️  ${chrome.i18n.getMessage(
    "helpUsWithAReview"
  )}`;
  reviewButton.style.cursor = "pointer";
  reviewButton.addEventListener("click", () => {
    chrome.storage.sync.set({
      nextRatingRequest: false,
    });
    close();
  });

  content.appendChild(reviewButton);

  const laterButton = document.createElement("button");
  laterButton.style.backgroundColor = "var(--yt-spec-badge-chip-background)";
  laterButton.style.textTransform = "uppercase";
  laterButton.style.whiteSpace = "pre";
  laterButton.style.color = "var(--yt-spec-text-primary)";
  laterButton.style.display = "block";
  laterButton.style.marginRight = "4px";
  laterButton.style.marginBottom = "4px";
  laterButton.style.fontSize = "14px";
  laterButton.style.border = "1px solid var(--yt-spec-10-percent-layer)";
  laterButton.style.width = "100%";
  laterButton.style.borderRadius = "2px";
  laterButton.style.padding = "10px 16px 10px 28px";
  laterButton.style.textIndent = "-17px";
  laterButton.style.whiteSpace = "normal";
  laterButton.style.cursor = "pointer";
  laterButton.style.boxSizing = "border-box";
  laterButton.style.textAlign = "left";
  laterButton.textContent = `💨  ${chrome.i18n.getMessage("later")}`;
  laterButton.addEventListener("click", () => {
    chrome.storage.sync.set({
      nextRatingRequest: videoCount + 100,
    });
    close();
  });
  content.appendChild(laterButton);

  const daaButton = document.createElement("button");
  daaButton.style.backgroundColor = "var(--yt-spec-badge-chip-background)";
  daaButton.style.textTransform = "uppercase";
  daaButton.style.whiteSpace = "pre";
  daaButton.style.color = "var(--yt-spec-text-primary)";
  daaButton.style.display = "block";
  daaButton.style.marginRight = "4px";
  daaButton.style.fontSize = "14px";
  daaButton.style.border = "1px solid var(--yt-spec-10-percent-layer)";
  daaButton.style.width = "100%";
  daaButton.style.borderRadius = "2px";
  daaButton.style.padding = "10px 16px 10px 28px";
  daaButton.style.textIndent = "-17px";
  daaButton.style.whiteSpace = "normal";
  daaButton.style.cursor = "pointer";
  daaButton.style.marginBottom = "0";
  daaButton.style.boxSizing = "border-box";
  daaButton.style.textAlign = "left";
  daaButton.textContent = `👎  ${chrome.i18n.getMessage("dontAskAgain")}`;
  daaButton.addEventListener("click", () => {
    chrome.storage.sync.set({
      nextRatingRequest: false,
    });
    close();
  });
  content.appendChild(daaButton);
}







   
          






   
          

   
          
