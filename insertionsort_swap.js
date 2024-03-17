import * as controller from "./sortvisualizer/controller.js";

let indexPointer;
let secondPointer;
let thirdPointer;

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

    // create a thirdPointer to point to the one below this
    thirdPointer = controller.createPointer("third", "orange");
    thirdPointer.setIndex(indexPointer);

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
  // 
  controller.disableControls();

  //console.log(`inner loop`);
  
  // if second and third pointer are different - decrement both,
  // if they are the same - only decrement third

  // Start by decrementing the third pointer
  if(secondPointer.index !== thirdPointer.index) {
    secondPointer.decrement();
  }
  
  await thirdPointer.decrement();

  // if decremented outside of array - we are done
  if (thirdPointer.index < 0) {
    innerLoopDone();
  } else {
    // highlight the index to compare to the key
    controller.highlightIndex(secondPointer);
    await controller.highlightIndex(thirdPointer);

    // compare thirdPointer to secondPointer 
    // if third is larger, then swap them
    if (controller.compare(thirdPointer, secondPointer) > 0) {
      console.log(`Swap!`);
      
      // Wait for step!
      controller.actions.step = swap;
      controller.enableControls();
    } else {
      // secondPointer is larger than thirdPointer, so we are done!

      // and wait for next step
      controller.actions.step = innerLoopDone;
      controller.enableControls();
    }
  }
}

async function innerLoopDone() {
  controller.disableControls();
  console.log(`Stop inner loop`);
  
  // If the inner loop ends before the beginning of the list:
  // - we  need to stop highlighting values
  if (secondPointer.index >= 0) {
    controller.unHighlightIndex(secondPointer);
  }
  if (thirdPointer.index >= 0) {
    controller.unHighlightIndex(thirdPointer);
  }

  // no matter - we destroy the second and third pointer when exiting the inner loop
  thirdPointer.destroy();
  await secondPointer.destroy();


  // finally: end the inner loop and continue the outer
  controller.actions.step = outerLoop;
  controller.enableControls();
}

async function swap() {
  controller.disableControls();
  // The swap step is still inside the inner loop
  await controller.swap(secondPointer, thirdPointer);

  // continue inner loop
  controller.actions.step = innerLoop;
  controller.enableControls();
}

init();
