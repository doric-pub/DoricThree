import { Resource } from "doric";
import * as Three from "three";
import { GLTFContext } from "./extensions/GLTFExtensions";
export declare class KTX2Loader {
    extensionFlag: number;
    constructor(renderer: Three.WebGLRenderer);
    loadTexture(context: GLTFContext, resource: Resource): Promise<Three.Texture | undefined>;
}
