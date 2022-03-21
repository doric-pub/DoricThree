import {
  EXTENSIONS,
  TextureExtension,
  WEBGL_FILTERS,
  WEBGL_WRAPPINGS,
} from "./GLTFExtensions";
import { ArrayBufferResource, loge, Resource } from "doric";
import * as Three from "three";
import { UnifiedResource } from "../../utils";
import * as GSpec from "../gltf";

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export class GLTFTextureBasisUExtension extends TextureExtension {
  name = EXTENSIONS.KHR_TEXTURE_BASISU;
  textureCache: Record<string, Three.Texture> = {};

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

    const cacheKey =
      (source.uri || source.bufferView) + ":" + textureDef.sampler;

    if (!!this.textureCache[cacheKey]) {
      // See https://github.com/mrdoob/three.js/issues/21559.
      return this.textureCache[cacheKey];
    }

    let resource: Resource;
    if (source.bufferView !== undefined) {
      const arrayBuffer = await this.context.getDependency<ArrayBuffer>(
        "bufferView",
        source.bufferView
      );
      if (!!!arrayBuffer) {
        loge(
          `THREE.GLTFLoader: ${this.name} Image ${textureIndex} is missing bufferView ${source.bufferView}`
        );
        return;
      }
      resource = new ArrayBufferResource(arrayBuffer);
    } else if (source.uri !== undefined) {
      const url = Three.LoaderUtils.resolveURL(
        decodeURIComponent(source.uri) || "",
        this.context.option.path
      );
      resource = new UnifiedResource(this.context.option.resType, url);
    } else {
      loge(
        `THREE.GLTFLoader: Image ${textureIndex} is missing URI and bufferView,source is ${JSON.stringify(
          source
        )}`
      );
      return;
    }
    if (!!!this.context.ktx2Loader) {
      loge(
        "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures"
      );
      return;
    } else {
      const texture = await this.context.ktx2Loader.loadTexture(
        this.context,
        resource
      );
      if (!!!texture) {
        loge("THREE.KTXLoader: loadTexture error");
        return;
      }
      //texture.flipY = false;

      if (textureDef.name) texture.name = textureDef.name;

      // const samplers: GSpec.Sampler[] = this.gltf.samplers || [];
      // const sampler: GSpec.Sampler = samplers[textureDef.sampler!!] || {};

      // texture.magFilter =
      //   WEBGL_FILTERS[sampler.magFilter!!] || Three.LinearFilter;
      // texture.minFilter =
      //   WEBGL_FILTERS[sampler.minFilter!!] || Three.LinearMipmapLinearFilter;
      // texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS!!] || Three.RepeatWrapping;
      // texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT!!] || Three.RepeatWrapping;
      this.context.associations.set(texture, { index: textureIndex });
      this.textureCache[cacheKey] = texture;
      return texture;
    }
  }
}
