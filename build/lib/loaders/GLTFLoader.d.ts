import { BridgeContext, Resource } from "doric";
import * as Three from "three";
import { GLTFContext, GLTFExtension } from "./extensions/GLTFExtensions";
import * as GSpec from "./gltf";
export declare function loadGLTF(context: BridgeContext, resource: Resource): Promise<GLTF>;
export declare type GLTF = {
    scene: THREE.Scene;
    scenes: THREE.Scene[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset: GSpec.Asset;
    userData: {};
};
export declare class GLTFLoader extends Three.Loader {
    context: BridgeContext;
    extensionTypes: Array<new (context: GLTFContext) => GLTFExtension>;
    constructor(context: BridgeContext);
    load(resource: Resource): Promise<GLTF>;
}
