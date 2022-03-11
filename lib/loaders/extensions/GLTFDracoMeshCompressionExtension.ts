import { EXTENSIONS, PremitiveExtension } from "./GLTFExtensions";
import * as GSpec from "../glTF";
import { loge } from "doric/lib/src/util/log";
import * as Three from "three";

const ATTRIBUTES: Record<string, string> = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv2",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex",
};

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
export class GLTFDracoMeshCompressionExtension extends PremitiveExtension {
  name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;

  async decodePrimitive(primitive: GSpec.MeshPrimitive) {
    if (!!!this.context.dracoLoader) {
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    }
    const bufferViewIndex = primitive.extensions[this.name].bufferView;
    const extensionAttributes = primitive.extensions[this.name].attributes;
    const threeAttributeMap: Record<string, number> = {};
    const attributeNormalizedMap: Record<string, boolean> = {};
    const attributeTypeMap: Record<string, number> = {};

    for (const attributeName in extensionAttributes) {
      const lowerCaseName =
        ATTRIBUTES[attributeName] || attributeName.toLowerCase();

      threeAttributeMap[lowerCaseName] = extensionAttributes[attributeName];
    }

    for (const attributeName in primitive.attributes) {
      const lowerCaseName =
        ATTRIBUTES[attributeName] || attributeName.toLowerCase();
      if (extensionAttributes[attributeName] !== undefined) {
        const accessorDef =
          this.gltf.accessors?.[primitive.attributes[attributeName]];
        if (!!!accessorDef) {
          loge(
            this.name,
            "error: cannot find accessor ",
            primitive.attributes[attributeName]
          );
          continue;
        }
        attributeTypeMap[lowerCaseName] = accessorDef.componentType;
        attributeNormalizedMap[lowerCaseName] =
          accessorDef?.normalized === true;
      }
    }
    const bufferView = await this.context.getDependency<ArrayBuffer>(
      "bufferView",
      bufferViewIndex
    );
    const geometry = await this.context.dracoLoader.decodeDracoFile(
      bufferView,
      threeAttributeMap,
      attributeTypeMap
    );
    for (const attributeName in geometry.attributes) {
      const attribute = geometry.attributes[attributeName];
      const normalized = attributeNormalizedMap[attributeName];

      if (normalized !== undefined) attribute.normalized = normalized;
    }
    return geometry;
  }
}
