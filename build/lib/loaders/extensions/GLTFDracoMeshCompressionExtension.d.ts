import { PremitiveExtension } from "./GLTFExtensions";
import * as GSpec from "../glTF";
import * as Three from "three";
/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export declare class GLTFDracoMeshCompressionExtension extends PremitiveExtension {
    name: string;
    decodePrimitive(primitive: GSpec.MeshPrimitive): Promise<Three.BufferGeometry>;
}
