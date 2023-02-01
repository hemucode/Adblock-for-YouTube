/* eslint-disable no-prototype-builtins */

// We need an iife here because this script
// is beeing run in the main context of the page.
(() => {
  const scriptlets = {
    "set-constant": function setConstant() {
      const chain = "{{1}}";
      let cValue = "{{2}}";
      const thisScript = document.currentScript;
      if (cValue === "undefined") {
        cValue = undefined;
      } else if (cValue === "false") {
        cValue = false;
      } else if (cValue === "true") {
        cValue = true;
      } else if (cValue === "null") {
        cValue = null;
      } else if (cValue === "''") {
        cValue = "";
      } else if (cValue === "[]") {
        cValue = [];
      } else if (cValue === "{}") {
        cValue = {};
      } else if (cValue === "noopFunc") {
        cValue = function () {};
      } else if (cValue === "trueFunc") {
        cValue = function () {
          return true;
        };
      } else if (cValue === "falseFunc") {
        cValue = function () {
          return false;
        };
      } else if (/^\d+$/.test(cValue)) {
        cValue = parseFloat(cValue);
        if (isNaN(cValue)) {
          return;
        }
        if (Math.abs(cValue) > 0x7fff) {
          return;
        }
      } else {
        return;
      }
      let aborted = false;
      const mustAbort = function (v) {
        if (aborted) {
          return true;
        }
        aborted =
          v !== undefined &&
          v !== null &&
          cValue !== undefined &&
          cValue !== null &&
          typeof v !== typeof cValue;
        return aborted;
      };
      // https://github.com/uBlockOrigin/uBlock-issues/issues/156
      //   Support multiple trappers for the same property.
      const trapProp = function (owner, prop, configurable, handler) {
        if (handler.init(owner[prop]) === false) {
          return;
        }
        const odesc = Object.getOwnPropertyDescriptor(owner, prop);
        let prevGetter, prevSetter;
        if (odesc instanceof Object) {
          owner[prop] = cValue;
          if (odesc.get instanceof Function) {
            prevGetter = odesc.get;
          }
          if (odesc.set instanceof Function) {
            prevSetter = odesc.set;
          }
        }
        try {
          Object.defineProperty(owner, prop, {
            configurable,
            get() {
              if (prevGetter !== undefined) {
                prevGetter();
              }
              return handler.getter(); // cValue
            },
            set(a) {
              if (prevSetter !== undefined) {
                prevSetter(a);
              }
              handler.setter(a);
            },
          });
        } catch (ex) {
          // Ignore
        }
      };
      const trapChain = function (owner, chain) {
        const pos = chain.indexOf(".");
        if (pos === -1) {
          trapProp(owner, chain, false, {
            v: undefined,
            init: function (v) {
              if (mustAbort(v)) {
                return false;
              }
              this.v = v;
              return true;
            },
            getter: function () {
              return document.currentScript === thisScript ? this.v : cValue;
            },
            setter: function (a) {
              if (mustAbort(a) === false) {
                return;
              }
              cValue = a;
            },
          });
          return;
        }
        const prop = chain.slice(0, pos);
        const v = owner[prop];
        chain = chain.slice(pos + 1);
        if (v instanceof Object || (typeof v === "object" && v !== null)) {
          trapChain(v, chain);
          return;
        }
        trapProp(owner, prop, true, {
          v: undefined,
          init: function (v) {
            this.v = v;
            return true;
          },
          getter: function () {
            return this.v;
          },
          setter: function (a) {
            this.v = a;
            if (a instanceof Object) {
              trapChain(a, chain);
            }
          },
        });
      };
      trapChain(window, chain);
    }.toString(),
    "json-prune": function jsonPrune() {
      const rawPrunePaths = "{{1}}";
      const rawNeedlePaths = "{{2}}";
      const prunePaths =
        rawPrunePaths !== "{{1}}" && rawPrunePaths !== ""
          ? rawPrunePaths.split(/ +/)
          : [];
      let needlePaths;
      let log, reLogNeedle;
      if (prunePaths.length !== 0) {
        needlePaths =
          prunePaths.length !== 0 &&
          rawNeedlePaths !== "{{2}}" &&
          rawNeedlePaths !== ""
            ? rawNeedlePaths.split(/ +/)
            : [];
      } else {
        log = console.log.bind(console);
        let needle;
        if (rawNeedlePaths === "" || rawNeedlePaths === "{{2}}") {
          needle = ".?";
        } else if (
          rawNeedlePaths.charAt(0) === "/" &&
          rawNeedlePaths.slice(-1) === "/"
        ) {
          needle = rawNeedlePaths.slice(1, -1);
        } else {
          needle = rawNeedlePaths.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        reLogNeedle = new RegExp(needle);
      }
      const findOwner = function (root, path, prune = false) {
        let owner = root;
        let chain = path;
        for (;;) {
          if (typeof owner !== "object" || owner === null) {
            return false;
          }
          const pos = chain.indexOf(".");
          if (pos === -1) {
            if (prune === false) {
              return owner.hasOwnProperty(chain);
            }
            if (chain === "*") {
              for (const key in owner) {
                if (owner.hasOwnProperty(key) === false) {
                  continue;
                }
                delete owner[key];
              }
            } else if (owner.hasOwnProperty(chain)) {
              delete owner[chain];
            }
            return true;
          }
          const prop = chain.slice(0, pos);
          if (
            (prop === "[]" && Array.isArray(owner)) ||
            (prop === "*" && owner instanceof Object)
          ) {
            const next = chain.slice(pos + 1);
            let found = false;
            for (const key of Object.keys(owner)) {
              found = findOwner(owner[key], next, prune) || found;
            }
            return found;
          }
          if (owner.hasOwnProperty(prop) === false) {
            return false;
          }
          owner = owner[prop];
          chain = chain.slice(pos + 1);
        }
      };
      const mustProcess = function (root) {
        for (const needlePath of needlePaths) {
          if (findOwner(root, needlePath) === false) {
            return false;
          }
        }
        return true;
      };
      const pruner = function (o) {
        if (log !== undefined) {
          const json = JSON.stringify(o, null, 2);
          if (reLogNeedle.test(json)) {
            log("uBO:", location.hostname, json);
          }
          return o;
        }
        if (mustProcess(o) === false) {
          return o;
        }
        for (const path of prunePaths) {
          findOwner(o, path, true);
        }
        return o;
      };
      JSON.parse = new Proxy(JSON.parse, {
        apply: function () {
          return pruner(Reflect.apply(...arguments));
        },
      });
      Response.prototype.json = new Proxy(Response.prototype.json, {
        apply: function () {
          return Reflect.apply(...arguments).then((o) => pruner(o));
        },
      });
    }.toString(),
    "no-floc": function noFloc() {
      if (Document instanceof Object === false) {
        return;
      }
      if (Document.prototype.interestCohort instanceof Function === false) {
        return;
      }
      Document.prototype.interestCohort = new Proxy(
        Document.prototype.interestCohort,
        {
          apply: function () {
            return Promise.reject();
          },
        }
      );
    }.toString(),
  };

  function patchScriptlet(scriptlet, args) {
    let s = args;
    let len = s.length;
    let beg = 0,
      pos = 0;
    let i = 1;
    while (beg < len) {
      pos = s.indexOf(",", pos);
      // Escaped comma? If so, skip.
      if (pos > 0 && s.charCodeAt(pos - 1) === 0x5c /* '\\' */) {
        s = s.slice(0, pos - 1) + s.slice(pos);
        len -= 1;
        continue;
      }
      if (pos === -1) {
        pos = len;
      }
      scriptlet = scriptlet.replace(
        `{{${i}}}`,
        s
          .slice(beg, pos)
          .trim()
          .replace(/[\\'"]/g, "\\$&")
      );
      beg = pos = pos + 1;
      i++;
    }
    return scriptlet;
  }

  function injectScriptlet(scriptlet) {
    const script = document.createElement("script");
    script.appendChild(
      document.createTextNode(decodeURIComponent(`(${scriptlet})();`))
    );
    (document.head || document.documentElement)?.appendChild(script);
  }

  function runScriptlets(rules) {
    for (const [name, args] of rules) {
      const scriptlet = scriptlets[name];
      injectScriptlet(patchScriptlet(scriptlet, args));
    }
  }

  runScriptlets([
    ["set-constant", "playerResponse.adPlacements, undefined"],
    ["set-constant", "ytInitialPlayerResponse.adPlacements, undefined"],
    [
      "json-prune",
      "[].playerResponse.adPlacements [].playerResponse.playerAds playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds",
    ],
  ]);
})();
