import { BridgeContext, Resource } from "doric";
import * as Three from "three";
export declare class KTX2Loader {
    extensionFlag: number;
    constructor(renderer: Three.WebGLRenderer);
    loadTexture(context: BridgeContext, resource: Resource): Promise<Three.Texture | undefined>;
}
