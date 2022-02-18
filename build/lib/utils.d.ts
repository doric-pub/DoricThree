import { Resource } from "doric";
export declare const console: {
    error: (...args: any) => void;
    warn: (...args: any) => void;
    log: (...args: any) => void;
};
export declare class UnifiedResource extends Resource {
    constructor(type: string, identifier: string);
}
