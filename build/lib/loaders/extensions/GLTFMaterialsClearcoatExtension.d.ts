import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
export declare class GLTFMaterialsClearcoatExtension extends MeshExtension {
    name: string;
    getMaterialType(materialIndex: number): typeof Three.MeshPhysicalMaterial | undefined;
    extendMaterialParams: (materialIndex: number, materialParams: Three.MeshPhysicalMaterialParameters) => Promise<(Three.Texture | undefined)[] | undefined>;
}
