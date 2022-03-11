import { EXTENSIONS, TextureExtension } from "./GLTFExtensions";
import { logw } from "doric";
import { loge } from "doric/lib/src/util/log";

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export class GLTFTextureBasisUExtension extends TextureExtension {
  name = EXTENSIONS.KHR_TEXTURE_BASISU;

  async loadTexture(textureIndex: number) {
    const textureDef = this.gltf.textures?.[textureIndex];

    if (!!!textureDef?.extensions?.[this.name]) {
      return;
    }
    const extension = textureDef.extensions[this.name];
    const source = this.gltf.images?.[extension.source];
    if (!!!source) {
      return;
    }
    const loader = this.context.ktx2Loader;

    if (!loader) {
      if (
        this.gltf.extensionsRequired &&
        this.gltf.extensionsRequired.indexOf(this.name) >= 0
      ) {
        throw new Error(
          "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures"
        );
      } else {
        logw(
          "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures"
        );
        // Assumes that the extension is optional and that a fallback texture is present
        return;
      }
    }
    const ret = await this.context.loadTextureImage(textureIndex, source);
    return ret;
  }
}
