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

*/
const SELECTOR = "div pre code, div.highlight pre, article pre";

const PREFIX = "@@@INJECT_CSS@@@";
const SUFFIX = "@@@END@@@";

const ELEMENT_ID = "pug-css-injection";

let styleElement;
let stylesheet = "";
let currentUrl = location.href;

// string functions //

String.prototype.reverse = String.prototype.reverse || function() {
    return this.split("").reverse().join("");
};

String.prototype.ifStartsWithReplace = String.prototype.ifStartsWithReplace || function(check, replace = "") {
  if (this.startsWith(check)) {
    return replace + this.substr(check.length);
  }
  return this;
};

String.prototype.ifEndsWithReplace = String.prototype.ifEndsWithReplace || function(check, replace = "") {
  if (this.endsWith(check)) {
    // there might be a better way of doing this but idc
    return this.reverse().substr(check.length).reverse() + replace;
  }
  return this;
};




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

// selectEvent

function warnEmpty(name) {
  console.log(`%cWARNING! The function '${name}' is empty!`, "color: orange;");
}

let defaultEventData = {
  before: warnEmpty.bind("before"),
  during: warnEmpty.bind("during"),
  after: warnEmpty.bind("after"),
};

const EventPosition = {
  before: 0,
  during: 1,
  after: 2,
};

const EventCaller = {
  observer: 0,
  interval: 1,
};

function selectEvent(selector, eventData = defaultEventData, root = document.documentElement) {
  let defaultEvent = {
    selector: selector,
    position: EventPosition.before,
  };


  const observer = new MutationObserver((records) => {
    var event = defaultEvent;
    event.caller = EventCaller.observer;

    // before
    eventData.before(event);

    // during
    event.position = EventPosition.during;
    var elems = applySelector(selector, records);
    for (const elem of elems) {
      event.element = elem;
      eventData.during(event);
    }

    // after
    event.position = EventPosition.after;
    eventData.after(event);
  });

  observer.observe(root, { childList: true, subtree: true });


  setInterval(() => {
    var event = defaultEvent;
    event.caller = EventCaller.interval;

    // before
    eventData.before(event);

    // during
    event.position = EventPosition.during;
    var elems = root.querySelectorAll(selector);
    for (const elem of elems) {
      event.element = elem;
      eventData.during(event);
    }

    // after
    event.position = EventPosition.after;
    eventData.after(event);
  }, 1000);
}

// main //

selectEvent(SELECTOR, {
  before: (event) => {
    if (event.caller == EventCaller.observer)
      return;
    stylesheet = "";
  },

  during: (event) => {
    var elem = event.element;

    var cssToAdd = elem.innerText.trim();
    cssToAdd = cssToAdd.ifStartsWithReplace(PREFIX);
    cssToAdd = cssToAdd.ifEndsWithReplace(SUFFIX);

    if (cssToAdd === elem.innerText) {
      // nothing changed
      return;
    }

    stylesheet += cssToAdd;

    elem.parentElement.hidden = true;
  },

  after: (event) => {
    stylesheet = stylesheet.trim();

    var exists = !!styleElement;
    var changed = exists && stylesheet !== styleElement.textContent;

    if (!exists) {
      styleElement = document.createElement("style");
      styleElement.id = ELEMENT_ID;
    }
    if (changed)
      styleElement.textContent = stylesheet;

    if (!exists)
      document.head.append(styleElement);
  },
});

setInterval(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    if (styleElement)
      styleElement.remove();
  }
}, 500);

console.log("%cLOADED!", 'font-size: 100px; font-family: "Papyrus", "Comic Sans MS", sans-serif;');
