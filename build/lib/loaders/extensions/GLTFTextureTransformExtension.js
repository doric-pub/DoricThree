import { EXTENSIONS, TextureExtraExtension } from "./GLTFExtensions";
import { logw } from "doric";
/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
export class GLTFTextureTransformExtension extends TextureExtraExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;
    }
    extendTexture(texture, transform) {
        if (transform.texCoord !== undefined) {
            logw('THREE.GLTFLoader: Custom UV sets in "' +
                this.name +
                '" extension not yet supported.');
        }
        if (transform.offset === undefined &&
            transform.rotation === undefined &&
            transform.scale === undefined) {
            // See https://github.com/mrdoob/three.js/issues/21819.
            return texture;
        }
        texture = texture.clone();
        if (transform.offset !== undefined) {
            texture.offset.fromArray(transform.offset);
        }
        if (transform.rotation !== undefined) {
            texture.rotation = transform.rotation;
        }
        if (transform.scale !== undefined) {
            texture.repeat.fromArray(transform.scale);
        }
        texture.needsUpdate = true;
        return texture;
    }
}
//# sourceMappingURL=GLTFTextureTransformExtension.js.map