import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
export class GLTFMaterialsSpecularExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

  getMaterialType(materialIndex: number) {
    const materialDef = this.gltf.materials?.[materialIndex];
    if (!!!materialDef?.extensions?.[this.name]) {
      return undefined;
    }

    return Three.MeshPhysicalMaterial;
  }

  extendMaterialParams = async (
    materialIndex: number,
    materialParams: Three.MeshPhysicalMaterialParameters
  ) => {
    const materialDef = this.gltf.materials?.[materialIndex];
    if (!!!materialDef?.extensions?.[this.name]) {
      return;
    }
    const pending = [];

    const extension = materialDef.extensions[this.name];

    materialParams.specularIntensity =
      extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

    if (extension.specularTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "specularIntensityMap",
          extension.specularTexture
        )
      );
    }

    const colorArray = extension.specularColorFactor || [1, 1, 1];
    materialParams.specularColor = new Three.Color(
      colorArray[0],
      colorArray[1],
      colorArray[2]
    );

    if (extension.specularColorTexture !== undefined) {
      pending.push(
        this.context
          .assignTexture(
            materialParams,
            "specularColorMap",
            extension.specularColorTexture
          )
          .then((texture) => {
            if (texture) {
              texture.encoding = Three.sRGBEncoding;
            }
            return texture;
          })
      );
    }

    return Promise.all(pending);
  };
}
