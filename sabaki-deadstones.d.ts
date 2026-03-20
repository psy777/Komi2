declare module '@sabaki/deadstones' {
    export function guess(data: (0 | 1 | -1)[][], options?: { finished?: boolean; iterations?: number }): Promise<[number, number][]>;
    export function getProbabilityMap(data: (0 | 1 | -1)[][], iterations: number): Promise<number[][]>;
    export function playTillEnd(data: (0 | 1 | -1)[][], sign: -1 | 1): Promise<(0 | 1 | -1)[][]>;
    export function getFloatingStones(data: (0 | 1 | -1)[][]): Promise<[number, number][]>;
    export function useFetch(url: string): void;
}
