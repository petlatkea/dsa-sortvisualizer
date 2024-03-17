import * as controller from "./controller.js";

let model = null;

export function initView() {
  addEventListeners();
}

function addEventListeners() {
  document.querySelectorAll("#controls [data-action]").forEach(action => action.addEventListener("click", handleEvent));
}

function handleEvent(event) {
  const action = event.target.dataset.action;
  console.log(`Action: ${action}`);
  controller.performAction(action);
}

export function disableControls() {
  document.querySelectorAll("#controls [data-action]").forEach(control => control.disabled = true);
}


export function enableControls() {
  document.querySelectorAll("#controls [data-action]").forEach(control => control.disabled = false);
}


export function swap(indexA, indexB) {
  const itemA = document.querySelector(`#list .item:nth-child(${indexA+1})`);
  const itemB = document.querySelector(`#list .item:nth-child(${indexB+1})`);

  const itemARect = itemA.getBoundingClientRect();
  const itemBRect = itemB.getBoundingClientRect();
 
  // Animate itemA to midpoint, and then to itemB's position
  let distX = itemBRect.x - itemARect.x;
  itemA.style.setProperty("--dist_x", distX + "px");
  itemB.style.setProperty("--dist_x", -distX+"px");

  itemA.classList.add("swap");
  itemB.classList.add("swap");

  return promiseThatWaitsForAnimationOn(itemA, () => {
    // After swapping elements - unswap instantly and display actual list (should be swapped in model)
    itemA.classList.remove("swap");
    itemB.classList.remove("swap");
    itemA.style.removeProperty("--dist_x");
    itemB.style.removeProperty("--dist_x");
    displayList();
  });
}

export function shift(index) {
  const itemA = document.querySelector(`#list .item:nth-child(${index+1})`);
  const itemB = document.querySelector(`#list .item:nth-child(${index+2})`);

  const itemARect = itemA.getBoundingClientRect();
  const itemBRect = itemB.getBoundingClientRect();

  // if itemB is shifted, then subtract that from the x
  let shiftOffset = itemB.style.getPropertyValue("--dist_x").slice(0,-2);

  let distX = itemBRect.x - shiftOffset - itemARect.x;


  itemA.style.setProperty("--dist_x", distX + "px");
  itemA.classList.add("shift");
  return promiseThatWaitsForAnimationOn(itemA);
}

export function insertAt(originalIndex, newIndex) {
  // original index is the place where the newIndex should start from
  const itemStart = document.querySelector(`#list .item:nth-child(${originalIndex+1})`);
  // new index is the place where it should end
  const itemEnd = document.querySelector(`#list .item:nth-child(${newIndex+1})`);

  // Find the place to start
  const itemStartRect = itemStart.getBoundingClientRect();

  // redisplay list - with all adjustments removed
  // first make sure that no transitions occur
  document.querySelectorAll("#list .item").forEach(item => item.classList.add("no_transitions"));
  displayList();

  // Find the place to end
  const itemEndRect = itemEnd.getBoundingClientRect();

  // calculate deltas
  const deltaX = itemStartRect.x - itemEndRect.x;
  const deltaY = itemStartRect.y - itemEndRect.y;

  // position item at previous position
  itemEnd.style.setProperty("--delta_x", deltaX + "px");
  itemEnd.style.setProperty("--delta_y", deltaY + "px");

  // and animate to new one
  itemEnd.classList.add("insert");

  // TODO: When animation is over: re-enable transitions
  return promiseThatWaitsForAnimationOn(itemEnd, ()=> {
    // destroy animation and translation on this item (reverting to actual position == end position)
    itemEnd.classList.remove("insert");
    itemEnd.style.removeProperty("--delta_x");
    itemEnd.style.removeProperty("--delta_y");
    // re-enable transitions on items
    document.querySelectorAll("#list .item").forEach(item => item.classList.remove("no_transitions"));
  })
}

// Helper-function to create a promise that resolves when a transition completes
// just before resolving the promise, an optional function can be called with
// the element as parameter
function promiseThatWaitsForTransitionOn(element, optionalFunction) {
  return new Promise(function(resolve, reject) {
    element.addEventListener("transitionend", endMoving);
    function endMoving() {
      element.removeEventListener("transitionend", endMoving);
      if(optionalFunction) {
        optionalFunction(element);
      }
      resolve();
    }
  });
}

// Helper-function to create a promise that resolves when an animation completes
// just before resolving the promise, an optional function can be called with
// the element as parameter
function promiseThatWaitsForAnimationOn(element, optionalFunction) {
  return new Promise(function(resolve, reject) {
    element.addEventListener("animationend", remove);
    function remove() {
      element.removeEventListener("animationend", remove);
      if(optionalFunction) {
        optionalFunction(element);
      }
      resolve();
    }
  });
}

export function highlightIndex(index) {
  const item = document.querySelector(`#list .item:nth-child(${index+1})`);
  item.classList.add("pull_up");

  return promiseThatWaitsForTransitionOn(item);
}

export function unHighlightIndex(index) {
  const item = document.querySelector(`#list .item:nth-child(${index+1})`);
  item.classList.remove("pull_up");

  return promiseThatWaitsForTransitionOn(item);
}

export function createVisualPointer(color, offset) {
  const pointer = document.createElement("div");
  pointer.classList.add("arrow");
  pointer.classList.add(color);

  if(offset > 0) {
    pointer.style.scale = 0.78;
  }
  //pointer.style.left = offset * 4 + "px";
  //pointer.style.top = offset * 4 + "px";

  document.querySelector("#pointers").append(pointer);
  return pointer;
}

export function destroyVisualPointer(element) {
  element.classList.add("shrink");
  return promiseThatWaitsForAnimationOn(element, (element) => element.remove());
}

export function movePointerToIndex(pointer, index) {
  // Calculate x-offset of index
  const item = document.querySelector(`#list .item:nth-child(${index+1})`);
  const itemRect = item?.getBoundingClientRect() || {x:0, width:0};
  const pointerRect = pointer.getBoundingClientRect();
  const xOffset = itemRect.x - 8 + itemRect.width / 2 - pointerRect.width/2;
  pointer.style.translate = xOffset+"px -16px";
    
  return promiseThatWaitsForTransitionOn(pointer);
}

export function setPointerToIndex(pointer, index) {
  // Turn off transitions for this pointer (for now)
  pointer.classList.add("no_transitions");
  // Calculate x-offset of index
  const item = document.querySelector(`#list .item:nth-child(${index+1})`);
  const itemRect = item?.getBoundingClientRect() || {x:0, width:0};
  const pointerRect = pointer.getBoundingClientRect();
  const xOffset = itemRect.x - 8 + itemRect.width / 2 - pointerRect.width/2;
  pointer.style.translate = xOffset+"px -16px";
  
  // Turn on transitions again after this change
  requestAnimationFrame(() => requestAnimationFrame(() =>{
    pointer.classList.remove("no_transitions");
  }));
}

export function createVisualList(modelReference) {
  model = modelReference;

  const list = document.querySelector("#list");
  list.innerHTML = "";

  for(const value of model) {
    const item = document.createElement("div");
    item.classList.add("item");
    item.textContent = value;
    list.append(item);
  }
}

export function displayList() {
  const items = document.querySelectorAll("#list .item");

  for(let i=0; i < items.length; i++) {
    const item = items[i];
    item.textContent = model[i];

    // clear all classes and styles
    item.classList.remove("pull_up", "pull_down", "shift", "swap");
    item.removeAttribute("style");
  }
}