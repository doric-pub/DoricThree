import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
export class GLTFMaterialsTransmissionExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

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
    const pending = [];

    const extension = materialDef.extensions[this.name];

    if (extension.transmissionFactor !== undefined) {
      materialParams.transmission = extension.transmissionFactor;
    }

    if (extension.transmissionTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "transmissionMap",
          extension.transmissionTexture
        )
      );
    }

    return Promise.all(pending);
  };
}
