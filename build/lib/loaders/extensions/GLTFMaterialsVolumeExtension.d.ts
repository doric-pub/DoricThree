import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
export declare class GLTFMaterialsVolumeExtension extends MeshExtension {
    name: string;
    getMaterialType(materialIndex: number): typeof Three.MeshPhysicalMaterial | undefined;
    extendMaterialParams: (materialIndex: number, materialParams: Three.MeshPhysicalMaterialParameters) => Promise<void> | Promise<(Three.Texture | undefined)[]>;
}
