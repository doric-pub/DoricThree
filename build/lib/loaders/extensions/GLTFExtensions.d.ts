import * as GSpec from "../glTF";
import * as Three from "three";
export declare const EXTENSIONS: {
    KHR_DRACO_MESH_COMPRESSION: string;
    KHR_LIGHTS_PUNCTUAL: string;
    KHR_MATERIALS_CLEARCOAT: string;
    KHR_MATERIALS_IOR: string;
    KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: string;
    KHR_MATERIALS_SHEEN: string;
    KHR_MATERIALS_SPECULAR: string;
    KHR_MATERIALS_TRANSMISSION: string;
    KHR_MATERIALS_UNLIT: string;
    KHR_MATERIALS_VOLUME: string;
    KHR_TEXTURE_BASISU: string;
    KHR_TEXTURE_TRANSFORM: string;
    KHR_MESH_QUANTIZATION: string;
    EXT_TEXTURE_WEBP: string;
    EXT_MESHOPT_COMPRESSION: string;
};
export declare type GLTFDepsType = "scene" | "node" | "mesh" | "accessor" | "bufferView" | "buffer" | "material" | "texture" | "skin" | "animation" | "camera";
export declare const WEBGL_COMPONENT_TYPES: {
    5120: Int8ArrayConstructor;
    5121: Uint8ArrayConstructor;
    5122: Int16ArrayConstructor;
    5123: Uint16ArrayConstructor;
    5125: Uint32ArrayConstructor;
    5126: Float32ArrayConstructor;
};
export declare const ATTRIBUTES: Record<string, string>;
export declare type ValueOf<T> = T[keyof T];
export declare type GLTFContext = {
    gltf: GSpec.GLTF;
    _addNodeRef(cache: {
        refs: Record<number, number>;
        uses: Record<number, number>;
    }, index: number): void;
    addCache(n: string, v: Promise<any>): void;
    getCache(n: string): Promise<any> | undefined;
    assignTexture(materialParams: Three.MaterialParameters, mapName: string, mapDef: any): Promise<Three.Texture | undefined>;
    ktx2Loader?: Three.Loader;
    loadTextureImage(index: number, source: GSpec.Image): Promise<Three.Texture | undefined>;
    loadBuffer(index: number): Promise<ArrayBuffer | undefined>;
    getDependency<T>(type: GLTFDepsType, index: number): Promise<T>;
    meshoptDecoder?: {
        ready: () => Promise<void>;
        supported: boolean;
        decode: (source: Uint8Array, count: number, stride: number, mode: any, filter: any) => Promise<ArrayBuffer>;
    };
    dracoLoader?: {
        decodeDracoFile: (bufferView: ArrayBuffer, threeAttributeMap: Record<string, number>, attributeTypeMap: Record<string, number>) => Promise<Three.BufferGeometry>;
    };
};
export declare abstract class GLTFExtension {
    abstract name: string;
    context: GLTFContext;
    constructor(context: GLTFContext);
    markRefs?: () => void;
    beforeRoot?: () => void;
    afterRoot?: () => void;
    get gltf(): GSpec.GLTF;
}
export declare abstract class PremitiveExtension extends GLTFExtension {
    abstract decodePrimitive(primitive: GSpec.MeshPrimitive): Promise<Three.BufferGeometry | undefined>;
}
export declare abstract class AttachmentExtension extends GLTFExtension {
    abstract createNodeAttachment(index: number): Promise<Three.Object3D>;
}
export declare type MaterialClass = new (params: Three.MaterialParameters) => Three.Material;
export declare abstract class MeshExtension extends GLTFExtension {
    abstract getMaterialType(index: number): MaterialClass | undefined;
    createMaterial?: (params: Three.MaterialParameters) => Three.Material;
    extendParams?: (params: Three.MaterialParameters, materialDef: GSpec.Material) => void;
    extendMaterialParams?: (index: number, params: Three.MaterialParameters) => Promise<(Three.Texture | void)[] | void>;
}
export declare abstract class TextureExtension extends GLTFExtension {
    abstract loadTexture(textureIndex: number): Promise<Three.Texture | void>;
}
export declare abstract class TextureExtraExtension extends GLTFExtension {
    abstract extendTexture(texture: Three.Texture, extra: any): Three.Texture;
}
export declare abstract class BufferViewExtension extends GLTFExtension {
    abstract loadBufferView(index: number): Promise<ArrayBuffer | undefined>;
}
