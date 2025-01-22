import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskCommandParts, TaskPriority, TaskType } from './types/task';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): Promise<ReturnType<T>>;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        resolve(func(...args));
      }, wait);
    });
  };

  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return debouncedFunction;
}
