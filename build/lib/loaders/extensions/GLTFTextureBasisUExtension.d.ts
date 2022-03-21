import { TextureExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
export declare class GLTFTextureBasisUExtension extends TextureExtension {
    name: string;
    textureCache: Record<string, Three.Texture>;
    loadTexture(textureIndex: number): Promise<Three.Texture | undefined>;
}
