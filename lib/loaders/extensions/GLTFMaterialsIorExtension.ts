import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
export class GLTFMaterialsIorExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_IOR;

  getMaterialType(materialIndex: number) {
    const materialDef = this.gltf.materials?.[materialIndex];
    if (!!!materialDef?.extensions?.[this.name]) {
      return undefined;
    }
    return Three.MeshPhysicalMaterial;
  }

  extendMaterialParams = (
    materialIndex: number,
    materialParams: Three.MeshPhysicalMaterialParameters
  ) => {
    const materialDef = this.gltf.materials?.[materialIndex];
    if (!!!materialDef?.extensions?.[this.name]) {
      return Promise.resolve();
    }
    const extension = materialDef.extensions[this.name];
    materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;
    return Promise.resolve();
  };
}
