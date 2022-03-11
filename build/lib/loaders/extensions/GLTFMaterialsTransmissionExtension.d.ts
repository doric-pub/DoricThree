import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
export declare class GLTFMaterialsTransmissionExtension extends MeshExtension {
    name: string;
    getMaterialType(materialIndex: number): typeof Three.MeshPhysicalMaterial | undefined;
    extendMaterialParams: (materialIndex: number, materialParams: Three.MeshPhysicalMaterialParameters) => Promise<(Three.Texture | undefined)[] | undefined>;
}
