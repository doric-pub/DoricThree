import { BridgeContext, Resource } from "doric";
import { Loader, LoadingManager } from "three";
export declare class FileLoader extends Loader {
    context: BridgeContext;
    constructor(context: BridgeContext, manager?: LoadingManager);
    load(res: {
        url: string;
        type: string;
    } | Resource, onLoad: Function, onProgress: Function, onError: Function): any;
    setResponseType(value: string): this;
    setMimeType(value: string): this;
}
