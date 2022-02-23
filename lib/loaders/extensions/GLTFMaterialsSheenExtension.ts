import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
export class GLTFMaterialsSheenExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_SHEEN;

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

    const pending: Promise<Three.Texture>[] = [];

    materialParams.sheenColor = new Three.Color(0, 0, 0);
    materialParams.sheenRoughness = 0;
    materialParams.sheen = 1;

    const extension = materialDef.extensions[this.name];

    if (extension.sheenColorFactor !== undefined) {
      materialParams.sheenColor.fromArray(extension.sheenColorFactor);
    }

    if (extension.sheenRoughnessFactor !== undefined) {
      materialParams.sheenRoughness = extension.sheenRoughnessFactor;
    }

    if (extension.sheenColorTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "sheenColorMap",
          extension.sheenColorTexture
        )
      );
    }

    if (extension.sheenRoughnessTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "sheenRoughnessMap",
          extension.sheenRoughnessTexture
        )
      );
    }

    return Promise.all(pending);
  };
}
