var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, TextureExtension, } from "./GLTFExtensions";
import { ArrayBufferResource, loge } from "doric";
import * as Three from "three";
import { UnifiedResource } from "../../utils";
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export class GLTFTextureBasisUExtension extends TextureExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_TEXTURE_BASISU;
        this.textureCache = {};
    }
    loadTexture(textureIndex) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if (!!!((_b = textureDef === null || textureDef === void 0 ? void 0 : textureDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const extension = textureDef.extensions[this.name];
            const source = (_c = this.gltf.images) === null || _c === void 0 ? void 0 : _c[extension.source];
            if (!!!source) {
                return;
            }
            const cacheKey = (source.uri || source.bufferView) + ":" + textureDef.sampler;
            if (!!this.textureCache[cacheKey]) {
                // See https://github.com/mrdoob/three.js/issues/21559.
                return this.textureCache[cacheKey];
            }
            let resource;
            if (source.bufferView !== undefined) {
                const arrayBuffer = yield this.context.getDependency("bufferView", source.bufferView);
                if (!!!arrayBuffer) {
                    loge(`THREE.GLTFLoader: ${this.name} Image ${textureIndex} is missing bufferView ${source.bufferView}`);
                    return;
                }
                resource = new ArrayBufferResource(arrayBuffer);
            }
            else if (source.uri !== undefined) {
                const url = Three.LoaderUtils.resolveURL(decodeURIComponent(source.uri) || "", this.context.option.path);
                resource = new UnifiedResource(this.context.option.resType, url);
            }
            else {
                loge(`THREE.GLTFLoader: Image ${textureIndex} is missing URI and bufferView,source is ${JSON.stringify(source)}`);
                return;
            }
            if (!!!this.context.ktx2Loader) {
                loge("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
                return;
            }
            else {
                const texture = yield this.context.ktx2Loader.loadTexture(this.context, resource);
                if (!!!texture) {
                    loge("THREE.KTXLoader: loadTexture error");
                    return;
                }
                //texture.flipY = false;
                if (textureDef.name)
                    texture.name = textureDef.name;
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
        });
    }
}
//# sourceMappingURL=GLTFTextureBasisUExtension.js.map