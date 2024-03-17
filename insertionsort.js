import * as controller from "./sortvisualizer/controller.js";

let indexPointer;
let secondPointer;
let thirdPointer;

let key = 0;

function init() {
  controller.start();
  // Create pointer
  indexPointer = controller.createPointer("index", "blue");

  // Register step
  controller.actions.step = outerLoop;
  controller.enableControls();

  reset();
}

function reset() {
  indexPointer.setIndex(0);
  // TODO: Destroy additional pointers if present
}

async function outerLoop() {
  /* pseudo-code from CLRS (1-indexed):
   * for j = 2 to A.length
   *   key = A[j]
   *   // iinsert A[j] into sorted sequence
   *   i = j - 1
   *   while i > 0 and A[i] > key
   *     A[i+1] = A[i]
   *     i = i -1
   *   A[i+1] = key
   */

  controller.disableControls();

  // move indexPointer to next index
  await indexPointer.increment();

  // if we didn't move outside of the array
  if( indexPointer.index < controller.modelSize()) {

    // highlight that index - that is our key
    await controller.highlightIndex(indexPointer);

    // create a secondPointer to point to the key
    secondPointer = controller.createPointer("second", "green");
    secondPointer.setIndex(indexPointer);

    key = controller.read(secondPointer);

    // start inner loop
    controller.actions.step = innerLoop;
    controller.enableControls();
  } else {
    indexPointer.destroy();
    controller.actions.step = undefined;
    controller.enableControls();
  }
}

async function innerLoop() {
  /* pseudo-code from CLRS (1-indexed):
   *   while i > 0 and A[i] > key
   *     A[i+1] = A[i]
   *     i = i -1
   *   A[i+1] = key
   */
  controller.disableControls();

  // Start by decrementing the second pointer
  await secondPointer.decrement();

  // if decremented outside of array - we are done
  if (secondPointer.index < 0) {
    innerLoopDone();
  } else {
    // highlight the index to compare to the key
    await controller.highlightIndex(secondPointer);

    // compare secondPointer to indexPointer (the key)
    // if second is larger, then shift it
    if (controller.compareIndexToValue(secondPointer, key) > 0) {
      // Wait for step!
      controller.actions.step = shift;
      controller.enableControls();
    } else {
      // key is larger than second - so we are done

      // and wait for next step
      controller.actions.step = innerLoopDone;
      controller.enableControls();
    }
  }
}

async function innerLoopDone() {
  controller.disableControls();
  // If the inner loop ends before the beginning of the list:
  // - we were comparing to a value that was smaller than the key
  //   and need to stop highlighting that value
  if (secondPointer.index >= 0) {
    await controller.unHighlightIndex(secondPointer);
  }
  // no matter - we destroy the second pointer when exiting the inner loop
  await secondPointer.destroy();

  // and we insert the key (index) at where we were just before this one
  // *   A[i+1] = key
  await controller.insertAt(indexPointer, secondPointer.index + 1);

  // finally: end the inner loop and continue the outer
  controller.actions.step = outerLoop;
  controller.enableControls();
}

async function shift() {
  controller.disableControls();
  // The shift step is still inside the inner loop

  // unhighlight second pointer
  await controller.unHighlightIndex(secondPointer);
  // and shift it to the right
  // *     A[i+1] = A[i]
  await controller.shift(secondPointer);

  // continue inner loop
  controller.actions.step = innerLoop;
  controller.enableControls();
}

init();
