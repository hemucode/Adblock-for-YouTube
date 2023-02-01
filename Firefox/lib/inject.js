/*!
 *  By @Codehemu - https://github.com/hemucode/nonstop-youtube/license ( JS: MIT License)
 *  License - https://github.com/hemucode/nonstop-youtube/license ( CSS: MIT License)
 */
function injectMainScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = browser.runtime.getURL(src);
    script.onload = function () {
      this.remove();
      resolve();
    };
    script.onerror = reject;
    (document.head || document.documentElement).appendChild(script);
  });
}

injectMainScript("lib/scriptlets.js")

setInterval(()=>{
    const btn=document.querySelector(".ytp-ad-skip-button");
    const btn2=document.querySelector("#confirm-button");
    if(btn) {btn.click()}
    if(btn2) {btn2.click()}
    if( ! document.querySelector('.ad-showing') ) return
 
          const video=document.querySelector('video')
          if( ! video)  return

          if( btn) {
            btn.click()
          } else {
            video.currentTime = isNaN(video.duration) ? 0 : video.duration
          }
},300);










   
          






   
          

   
          
