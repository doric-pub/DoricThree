import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
export class GLTFMaterialsClearcoatExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;
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

    const extension = materialDef.extensions[this.name];

    if (extension.clearcoatFactor !== undefined) {
      materialParams.clearcoat = extension.clearcoatFactor;
    }

    if (extension.clearcoatTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "clearcoatMap",
          extension.clearcoatTexture
        )
      );
    }

    if (extension.clearcoatRoughnessFactor !== undefined) {
      materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
    }

    if (extension.clearcoatRoughnessTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "clearcoatRoughnessMap",
          extension.clearcoatRoughnessTexture
        )
      );
    }

    if (extension.clearcoatNormalTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "clearcoatNormalMap",
          extension.clearcoatNormalTexture
        )
      );

      if (extension.clearcoatNormalTexture.scale !== undefined) {
        const scale = extension.clearcoatNormalTexture.scale;

        materialParams.clearcoatNormalScale = new Three.Vector2(scale, scale);
      }
    }

    return Promise.all(pending);
  };
}
