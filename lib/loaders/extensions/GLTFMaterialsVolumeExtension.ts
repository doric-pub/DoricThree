import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
export class GLTFMaterialsVolumeExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_VOLUME;

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
    // TODO: check
    // materialParams.thickness =
    //   extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

    if (extension.thicknessTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "thicknessMap",
          extension.thicknessTexture
        )
      );
    }

    materialParams.attenuationDistance = extension.attenuationDistance || 0;

    const colorArray = extension.attenuationColor || [1, 1, 1];
    materialParams.attenuationColor = new Three.Color(
      colorArray[0],
      colorArray[1],
      colorArray[2]
    );

    return Promise.all(pending);
  };
}
