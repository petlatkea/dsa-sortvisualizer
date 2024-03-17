import * as view from "./view.js";
import * as model from "./model.js"

export function start() {
  view.createVisualList(model.list); // TODO: Maybe change to model module??
  view.initView();
}

export const actions = {
  enabled: true,
  step: undefined,
  run: undefined,
  pause: undefined,
  reset: undefined,
}

export function performAction(actionName) {
  if(actions.enabled) {
    const action = actions[actionName];
    if(action) {
      action();
    }
  }
}

export function disableControls() {
  actions.enabled = false;
  view.disableControls();
}

export function enableControls() {
  actions.enabled = true;
  view.enableControls();
}


/**
 * Compares indexA and indexB - returns negative if a should come before b, positive is a should come after
 * @param {Number|Pointer} indexA the first index - a number, or a Pointer object
 * @param {Number|Pointer} indexB 
 * @returns 
 */
export function compare(indexA, indexB) {  
  // Allow for parameters to be pointers or numbers
  if(indexA instanceof Pointer) indexA = indexA.index;
  if(indexB instanceof Pointer) indexB = indexB.index;
  
  // A negative value indicates that a should come before b.
  if(model.list[indexA] < model.list[indexB]) return -1;
  // A positive value indicates that a should come after b.
  if(model.list[indexA] > model.list[indexB]) return 1;
  // Zero or NaN indicates that a and b are considered equal.
  return 0;
}

export function compareIndexToValue(index, value) {  
  // Allow for parameters to be pointers or numbers
  if(index instanceof Pointer) index = index.index;
  
  // A negative value indicates that a should come before b.
  if(model.list[index] < value) return -1;
  // A positive value indicates that a should come after b.
  if(model.list[index] > value) return 1;
  // Zero or NaN indicates that a and b are considered equal.
  return 0;
}

export function swap(indexA, indexB) {
  // Allow for parameters to be pointers or numbers
  if(indexA instanceof Pointer) indexA = indexA.index;
  if(indexB instanceof Pointer) indexB = indexB.index;

  // swap in model immediately
  model.swap(indexA, indexB);

  // then visually swap items (and return a promise when done)
  return view.swap(indexA, indexB);
}

export function shift(index) {
  // Allow for parameter to be pointer or number
  if(index instanceof Pointer) index = index.index;

  // shift in model (note that this will overwrite the value of the next index! - unless stored in key)
  model.shift(index);

  // Visually shift item (but don't update next index yet)
  return view.shift(index);
}

export function insertAt(originalPosition, newIndex) {  
  // set value in model
  model.write(newIndex, originalPosition.value);

  // visually move original position to new index
  return view.insertAt(originalPosition.index, newIndex);
}

export function read(index) {
  // Allow for parameter to be pointer or number
  if(index instanceof Pointer) index = index.index;

  return model.read(index);
}

export function modelSize() {
  return model.list.length;
}

export function highlightIndex(index) {
  // Allow for parameters to be pointers or numbers
  if(index instanceof Pointer) index = index.index;
  return view.highlightIndex(index);
}

export function unHighlightIndex(index) {
  // Allow for parameters to be pointers or numbers
  if(index instanceof Pointer) index = index.index;
  return view.unHighlightIndex(index);
}

// ******* POINTERS *******

const pointers = { length: 0 }

export function createPointer(name, color) {
  const pointer = new Pointer(name,color);

  return pointer;
}

class Pointer {
  constructor(name, color) {
    this.name = name;
    this.index = 0;

    pointers[name] = this;
    pointers.length++;

    // Create visual pointer
    this.view = view.createVisualPointer(color, pointers.length-1);
  }

  destroy() {
    delete pointers[this.name];
    pointers.length--;
    return view.destroyVisualPointer(this.view);
  }

  increment() {
    this.index++;
    // TODO: Destroy if beyond model!
    return this.pointToIndex(this.index);
  }

  decrement() {
    this.index--;
    return this.pointToIndex(this.index);
  }

  pointToIndex(index) {
    if(index) {
      this.index = index;
    }
    
    this.value = model.read(this.index);

    return view.movePointerToIndex(this.view, this.index);
  }

  setIndex(index) {
    // Allow for another Pointer to be used as parameters
    if(index instanceof Pointer) {
      index = index.index;
    } 
    this.index = index;
    this.value = model.read(this.index);
    // Set the index immediately - no animation to wait for, no promise to resolve
    view.setPointerToIndex(this.view, this.index);
  }
}