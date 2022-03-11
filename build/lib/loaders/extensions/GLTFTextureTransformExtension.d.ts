import { TextureExtraExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
export declare class GLTFTextureTransformExtension extends TextureExtraExtension {
    name: string;
    extendTexture(texture: Three.Texture, transform: any): Three.Texture;
}
