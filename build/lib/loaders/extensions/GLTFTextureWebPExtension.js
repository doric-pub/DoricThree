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
/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
export class GLTFTextureWebPExtension extends TextureExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
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
            return this.context.loadTextureImage(textureIndex, source);
        });
    }
}
//# sourceMappingURL=GLTFTextureWebPExtension.js.map