import { BridgeContext } from "doric";
import THREE, { Loader, LoadingManager } from "three";
export declare class TextureLoader extends Loader {
    context: BridgeContext;
    constructor(context: BridgeContext, manager?: LoadingManager);
    load(res: {
        url: string;
        type: string;
    }, onLoad: Function, onProgress: Function, onError: Function): THREE.DataTexture;
}
