var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, TextureExtension } from "./GLTFExtensions";
import { logw } from "doric";
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export class GLTFTextureBasisUExtension extends TextureExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_TEXTURE_BASISU;
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
            const loader = this.context.ktx2Loader;
            if (!loader) {
                if (this.gltf.extensionsRequired &&
                    this.gltf.extensionsRequired.indexOf(this.name) >= 0) {
                    throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
                }
                else {
                    logw("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
                    // Assumes that the extension is optional and that a fallback texture is present
                    return;
                }
            }
            const ret = yield this.context.loadTextureImage(textureIndex, source);
            return ret;
        });
    }
}
//# sourceMappingURL=GLTFTextureBasisUExtension.js.map