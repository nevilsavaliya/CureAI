/**
 * Array manipulation utilities
 */

/**
 * Remove duplicates from array
 * @param array - Array with potential duplicates
 * @returns Array without duplicates
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Remove duplicates by property
 * @param array - Array with potential duplicates
 * @param property - Property to check for uniqueness
 * @returns Array without duplicates
 */
export function removeDuplicatesByProperty<T>(array: T[], property: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunk array into smaller arrays
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Shuffle array randomly
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random item from array
 * @param array - Array to pick from
 * @returns Random item
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random items from array
 * @param array - Array to pick from
 * @param count - Number of items to pick
 * @returns Array of random items
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Move item in array
 * @param array - Array to modify
 * @param fromIndex - Current index
 * @param toIndex - Target index
 * @returns Modified array
 */
export function moveItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Insert item at index
 * @param array - Array to modify
 * @param index - Index to insert at
 * @param item - Item to insert
 * @returns Modified array
 */
export function insertAt<T>(array: T[], index: number, item: T): T[] {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

/**
 * Remove item at index
 * @param array - Array to modify
 * @param index - Index to remove
 * @returns Modified array
 */
export function removeAt<T>(array: T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Update item at index
 * @param array - Array to modify
 * @param index - Index to update
 * @param item - New item
 * @returns Modified array
 */
export function updateAt<T>(array: T[], index: number, item: T): T[] {
  return [...array.slice(0, index), item, ...array.slice(index + 1)];
}

/**
 * Find index by property value
 * @param array - Array to search
 * @param property - Property to check
 * @param value - Value to find
 * @returns Index or -1 if not found
 */
export function findIndexByProperty<T>(array: T[], property: keyof T, value: any): number {
  return array.findIndex(item => item[property] === value);
}

/**
 * Find item by property value
 * @param array - Array to search
 * @param property - Property to check
 * @param value - Value to find
 * @returns Found item or undefined
 */
export function findByProperty<T>(array: T[], property: keyof T, value: any): T | undefined {
  return array.find(item => item[property] === value);
}

/**
 * Count occurrences of value
 * @param array - Array to count in
 * @param value - Value to count
 * @returns Count of occurrences
 */
export function countOccurrences<T>(array: T[], value: T): number {
  return array.filter(item => item === value).length;
}

/**
 * Get intersection of two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Intersection array
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => array2.includes(item));
}

/**
 * Get difference of two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Difference array (items in array1 not in array2)
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => !array2.includes(item));
}

/**
 * Get union of two arrays
 * @param array1 - First array
 * @param array2 - Second array
 * @returns Union array (unique items from both)
 */
export function union<T>(array1: T[], array2: T[]): T[] {
  return removeDuplicates([...array1, ...array2]);
}

/**
 * Check if arrays are equal
 * @param array1 - First array
 * @param array2 - Second array
 * @returns True if arrays are equal
 */
export function areArraysEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
}

/**
 * Flatten nested array
 * @param array - Nested array
 * @param depth - Depth to flatten (default: Infinity)
 * @returns Flattened array
 */
export function flattenArray<T>(array: any[], depth: number = Infinity): T[] {
  if (depth === 0) return array;
  
  return array.reduce((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...flattenArray(val, depth - 1));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
}

/**
 * Partition array by predicate
 * @param array - Array to partition
 * @param predicate - Predicate function
 * @returns Tuple of [matching, notMatching]
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const matching: T[] = [];
  const notMatching: T[] = [];
  
  array.forEach(item => {
    if (predicate(item)) {
      matching.push(item);
    } else {
      notMatching.push(item);
    }
  });
  
  return [matching, notMatching];
}

/**
 * Get first N items
 * @param array - Array to take from
 * @param count - Number of items
 * @returns First N items
 */
export function take<T>(array: T[], count: number): T[] {
  return array.slice(0, count);
}

/**
 * Get last N items
 * @param array - Array to take from
 * @param count - Number of items
 * @returns Last N items
 */
export function takeLast<T>(array: T[], count: number): T[] {
  return array.slice(-count);
}

/**
 * Check if array is empty
 * @param array - Array to check
 * @returns True if array is empty
 */
export function isEmpty<T>(array: T[] | null | undefined): boolean {
  return !array || array.length === 0;
}

/**
 * Check if array is not empty
 * @param array - Array to check
 * @returns True if array is not empty
 */
export function isNotEmpty<T>(array: T[] | null | undefined): boolean {
  return !isEmpty(array);
}
