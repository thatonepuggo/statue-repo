// ==UserScript==
// @name        GitHub CSS Injection
// @namespace   Violentmonkey Scripts
// @match       *://github.com/**
// @grant       none
// @version     1.4
// @author      Pug
// @description allows css injection on github
// @downloadURL https://github.com/thatonepuggo/statue-repo/raw/master/docs/githubcssinjector.user.js
// ==/UserScript==

/*
how to use:
create a code block and add @@@BEGIN_CSS_INJECTION@@@ to the beginning and @@@END_CSS_INJECTION@@@ to the end
add your css in between

example:

```
@@@BEGIN_CSS_INJECTION@@@
:is(p, h1, h2, h3, h4, h5, h6, span):hover {
font-family: "Webdings", "Comic Sans MS";
}
@@@END_CSS_INJECTION@@@
```

*/
const SELECTOR = "div pre code, div.highlight pre, article pre";

const PREFIX = "@@@BEGIN_CSS_INJECTION@@@";
const SUFFIX = "@@@END_CSS_INJECTION@@@";

const ELEMENT_ID = "pug-css-injection";

let styleElement;
let stylesheet = "";
let currentUrl = location.href;

// string functions //

String.prototype.reverse = String.prototype.reverse || function() {
  return this.split("").reverse().join("");
};

String.prototype.ifStartsWithReplace = String.prototype.ifStartsWithReplace || function(check, replace = "") {
  let pass = this.startsWith(check);
  //console.log(`${this} ${!!pass ? 'starts with' : 'doesn\'t start with'} ${check}`);
  if (pass) {
    return replace + this.substr(check.length);
  }
  return this;
};

String.prototype.ifEndsWithReplace = String.prototype.ifEndsWithReplace || function(check, replace = "") {
  let pass = this.endsWith(check);
  //console.log(`${this} ${!!pass ? 'ends with' : 'doesn\'t end with'} ${check}`);
  if (pass) {
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
      if (node.nodeType === Node.ELEMENT_NODE) {
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
    let event = defaultEvent;
    event.caller = EventCaller.observer;

    // before
    eventData.before(event);

    // during
    event.position = EventPosition.during;
    let elems = applySelector(selector, records);
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
    let event = defaultEvent;
    event.caller = EventCaller.interval;

    // before
    eventData.before(event);

    // during
    event.position = EventPosition.during;
    let elems = root.querySelectorAll(selector);
    for (const elem of elems) {
      event.element = elem;
      eventData.during(event);
    }

    // after
    event.position = EventPosition.after;
    eventData.after(event);
  }, 1000);
}

//////////
// main //
//////////

selectEvent(SELECTOR, {
  before: (event) => {
    if (event.caller === EventCaller.observer)
      return;
    stylesheet = "";
  },

  // ran for every element
  during: (event) => {
    let elem = event.element;

    let cssToAdd = elem.textContent.trim();
    let original = cssToAdd;

    cssToAdd = cssToAdd.ifStartsWithReplace(PREFIX);
    cssToAdd = cssToAdd.ifEndsWithReplace(SUFFIX);
    if (cssToAdd == original) {
      // nothing changed
      return;
    }

    stylesheet += cssToAdd;

    elem.parentElement.hidden = true;
  },

  after: (event) => {
    stylesheet = stylesheet.trim();

    let exists = !!styleElement;
    let changed = exists && stylesheet !== styleElement.textContent;

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
      styleElement.textContent = "";
  }
}, 100);

console.log("%cLOADED!", 'font-size: 100px; font-family: "Papyrus", "Comic Sans MS", sans-serif;');
