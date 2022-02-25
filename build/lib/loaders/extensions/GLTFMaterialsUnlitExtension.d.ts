import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
import * as GSpec from "../glTF";
/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
export declare class GLTFMaterialsUnlitExtension extends MeshExtension {
    name: string;
    getMaterialType(): typeof Three.MeshBasicMaterial;
    extendParams: (materialParams: Three.MeshBasicMaterialParameters, materialDef: GSpec.Material) => Promise<(Three.Texture | undefined)[]>;
}
