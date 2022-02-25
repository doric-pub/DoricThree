import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
import * as GSpec from "../glTF";
/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 */
/**
 * A sub class of StandardMaterial with some of the functionality
 * changed via the `onBeforeCompile` callback
 * @pailhead
 */
export declare class GLTFMeshStandardSGMaterial extends Three.MeshStandardMaterial {
    isGLTFSpecularGlossinessMaterial: boolean;
    constructor(params: Three.MeshStandardMaterialParameters);
    specularMap: any;
    specular?: Three.Color;
    glossinessMap: any;
    glossiness: number;
    metalness: any;
    roughness: any;
    metalnessMap: any;
    roughnessMap: any;
    copy(source: GLTFMeshStandardSGMaterial): this;
}
export declare class GLTFMaterialsPbrSpecularGlossinessExtension extends MeshExtension {
    name: string;
    specularGlossinessParams: string[];
    getMaterialType(): typeof GLTFMeshStandardSGMaterial;
    extendParams: (params: Three.MeshStandardMaterialParameters, materialDef: GSpec.Material) => Promise<(Three.Texture | undefined)[] | undefined>;
    createMaterial: (params: Three.MeshStandardMaterialParameters) => GLTFMeshStandardSGMaterial;
}
