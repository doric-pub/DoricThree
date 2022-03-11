import { MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
export declare class GLTFMaterialsIorExtension extends MeshExtension {
    name: string;
    getMaterialType(materialIndex: number): typeof Three.MeshPhysicalMaterial | undefined;
    extendMaterialParams: (materialIndex: number, materialParams: Three.MeshPhysicalMaterialParameters) => Promise<void>;
}
