import { BridgeContext, Resource } from "doric";
import * as Three from "three";
import { GLTFContext, GLTFExtension } from "./extensions/GLTFExtensions";
import * as GSpec from "./gltf";
export declare function loadGLTF(context: BridgeContext, resource: Resource, asyncTexture?: boolean): Promise<GLTF>;
export declare type GLTF = {
    scene: THREE.Group;
    scenes: THREE.Group[];
    animations: THREE.AnimationClip[];
    cameras: (THREE.PerspectiveCamera | THREE.OrthographicCamera)[];
    asset: GSpec.Asset;
    userData: {};
    pendingTextures: {
        texture: Three.Texture;
        resource: Resource;
    }[];
    variants?: {
        name: string;
    }[];
    variantChanger?: (index: number) => Promise<void>;
};
export declare class GLTFLoader extends Three.Loader {
    context: BridgeContext;
    extensionTypes: Array<new (context: GLTFContext) => GLTFExtension>;
    renderer: Three.WebGLRenderer | undefined;
    constructor(context: BridgeContext, renderer?: Three.WebGLRenderer);
    loadTexture(pendingTexture: {
        texture: Three.Texture;
        resource: Resource;
    }): Promise<Three.Texture>;
    load(resource: Resource, asyncTexture?: boolean): Promise<GLTF>;
}
