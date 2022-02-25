import { BufferViewExtension } from "./GLTFExtensions";
/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
export declare class GLTFMeshoptCompressionExtension extends BufferViewExtension {
    name: string;
    loadBufferView(index: number): Promise<ArrayBuffer | undefined>;
}
