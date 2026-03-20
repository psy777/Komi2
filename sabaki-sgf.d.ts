declare module '@sabaki/sgf' {
    export function parse(sgf: string): any[];
    export function stringify(rootNodes: any[]): string;
}
