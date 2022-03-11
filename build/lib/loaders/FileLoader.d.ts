import { BridgeContext, Resource } from "doric";
import { Loader, LoadingManager } from "three";
export declare class FileLoader extends Loader {
    context: BridgeContext;
    responseType: string;
    mimeType: string;
    constructor(context: BridgeContext, manager?: LoadingManager);
    load(res: {
        url: string;
        type: string;
    } | Resource, onLoad: Function, onProgress: Function | undefined, onError: Function): any;
    setResponseType(value: string): this;
    setMimeType(value: string): this;
}
