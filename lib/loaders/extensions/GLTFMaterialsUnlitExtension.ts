import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
import * as GSpec from "../glTF";
/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
export class GLTFMaterialsUnlitExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_UNLIT;

  getMaterialType() {
    return Three.MeshBasicMaterial;
  }

  extendParams = (
    materialParams: Three.MeshBasicMaterialParameters,
    materialDef: GSpec.Material
  ) => {
    const pending = [];

    materialParams.color = new Three.Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const metallicRoughness = materialDef.pbrMetallicRoughness;

    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor;

        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(
          this.context.assignTexture(
            materialParams,
            "map",
            metallicRoughness.baseColorTexture
          )
        );
      }
    }

    return Promise.all(pending);
  };
}
