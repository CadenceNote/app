import { useEffect, useState } from 'react';
import { debounce } from '@/lib/utils';

export function useDebounce<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const debouncedUpdate = debounce((val: T) => {
            setDebouncedValue(val);
        }, delay);

        debouncedUpdate(value);
        return () => debouncedUpdate.cancel();
    }, [value, delay]);

    return [debouncedValue];
} 