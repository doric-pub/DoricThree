import { EXTENSIONS, TextureExtension } from "./GLTFExtensions";

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
export class GLTFTextureWebPExtension extends TextureExtension {
  name = EXTENSIONS.EXT_TEXTURE_WEBP;

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
    return this.context.loadTextureImage(textureIndex, source);
  }
}
