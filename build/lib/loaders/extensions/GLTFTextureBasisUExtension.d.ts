import { TextureExtension } from "./GLTFExtensions";
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export declare class GLTFTextureBasisUExtension extends TextureExtension {
    name: string;
    loadTexture(textureIndex: number): Promise<import("three").Texture | undefined>;
}
