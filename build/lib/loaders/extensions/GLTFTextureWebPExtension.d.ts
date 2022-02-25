import { TextureExtension } from "./GLTFExtensions";
/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
export declare class GLTFTextureWebPExtension extends TextureExtension {
    name: string;
    loadTexture(textureIndex: number): Promise<import("three").Texture | undefined>;
}
