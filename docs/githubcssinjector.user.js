// ==UserScript==
// @name        GitHub CSS Injection
// @namespace   Violentmonkey Scripts
// @match       *://github.com/**
// @grant       none
// @version     1.0
// @author      Pug
// @description allows css injection on github
// @downloadURL https://github.com/thatonepuggo/statue-repo/raw/master/docs/githubcssinjector.user.js
// @updateURL https://github.com/thatonepuggo/statue-repo/raw/master/docs/githubcssinjector.user.js
// ==/UserScript==

/*
how to use:
create a code block and add @@@INJECT_CSS@@@ to the beginning and @@@END@@@ to the end
add your css in between

example:

```
@@@INJECT_CSS@@@
:is(p, h1, h2, h3, h4, h5, h6, span):hover {
font-family: "Webdings", "Comic Sans MS";
}
@@@END@@@
```

TODO:
- make the css stack so you can have chains of people adding onto the css
*/
const SELECTOR = "div pre code, div.highlight pre, article pre";

const PREFIX = "@@@INJECT_CSS@@@";
const SUFFIX = "@@@END@@@";

let styleElement;

// string functions //
function reverseString(str) {
    return str.split("").reverse().join("");
}

function ifStartsReplace(str, check, replace = "") {
  var ret = str;
  if (str.startsWith(check)) {
    ret = replace + str.substr(check.length);
  }
  return ret;
}

function ifEndsReplace(str, check, replace = "") {
  var ret = str;
  if (str.endsWith(check)) {
    // there might be a better way of doing this but idc
    ret = reverseString(reverseString(ret).substr(check.length)) + replace;
  }
  return ret;
}

// add style sheet //

function addStyle(styleString) {
  var exists = !!styleElement;
  if (!exists) {
    styleElement = document.createElement('style');
    styleElement.id = "pug-github-css-injection-stylesheet";
  }
  styleElement.textContent = styleString;
  if (!exists)
    document.head.append(styleElement);
}

function doCodeBlock(elem) {
  var cssToAdd = elem.innerText.trim();

  cssToAdd = ifStartsReplace(cssToAdd, PREFIX);
  cssToAdd = ifEndsReplace(cssToAdd, SUFFIX);

  if (cssToAdd === elem.innerText) {
    // nothing changed
    return;
  }

  addStyle(cssToAdd);

  /*
  var newElem = document.createElement("pre");
  newElem.style = cssToAdd;
  newElem.innerText = elem.innerText;
  newElem.setAttribute(MARK_ATTR, true);
  elem.parentElement.insertAdjacentElement("beforeend", newElem);
  console.log("stufsdafsdf")
  console.log(newElem);
  */

  elem.parentElement.remove();
}


function addAll(set, list) {
  for (const entry of list) {
    set.add(entry);
  }
}

function applySelector(selector, records) {
  // We can't create a NodeList; let's use a Set
  const result = new Set();
  // Loop through the records...
  for (const {addedNodes} of records) {
    for (const node of addedNodes) {
      // If it's an element...
      if (node.nodeType === 1) {
        // Add it if it's a match
        if (node.matches(selector)) {
            result.add(node);
        }
        // Add any children
        addAll(result, node.querySelectorAll(selector));
      }
    }
  }
  return [...result]; // Result is an array, or just return the set
}

function selectEvent(selector, func, root = document.documentElement) {
  // for newly created elements
  const observer = new MutationObserver((records) => {
    var elems = applySelector(selector, records);
    for (const elem of elems) {
      func(elem);
    }
  });

  observer.observe(root, { childList: true, subtree: true });

  // for existing elements
  var elems = root.querySelectorAll(selector);
  for (const elem of elems) {
    func(elem);
  }
}

// main //


console.log("%cLOADED", "font-size: 100px; font-family: \"Papyrus\", sans-serif;");
selectEvent(SELECTOR, doCodeBlock);


var currentUrl = location.href;
setInterval(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    styleElement.remove();
  }
}, 500);
