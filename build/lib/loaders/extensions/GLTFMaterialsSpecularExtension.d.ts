import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
export declare class GLTFMaterialsSpecularExtension extends MeshExtension {
    name: string;
    getMaterialType(materialIndex: number): typeof Three.MeshPhysicalMaterial | undefined;
    extendMaterialParams: (materialIndex: number, materialParams: Three.MeshPhysicalMaterialParameters) => Promise<(Three.Texture | undefined)[] | undefined>;
}
