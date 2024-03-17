
//                   0 1 2 3 4 5 6 7 8 9
export const list = [8,4,2,5,1,0,7,3,9,6];

export function swap(indexA, indexB) {
  const temp = list[indexA];
  list[indexA] = list[indexB];
  list[indexB] = temp;
}

export function shift(index) {
  return list[index+1] = list[index];
}

export function read(index) {
  return list[index];
}

export function write(index, value) {
  list[index] = value;
}