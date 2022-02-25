var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, PremitiveExtension, WEBGL_COMPONENT_TYPES, } from "./GLTFExtensions";
const ATTRIBUTES = {
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
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
    }
    decodePrimitive(primitive) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!!!this.context.dracoLoader) {
                throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
            }
            const bufferViewIndex = primitive.extensions[this.name].bufferView;
            const gltfAttributeMap = primitive.extensions[this.name].attributes;
            const threeAttributeMap = {};
            const attributeNormalizedMap = {};
            const attributeTypeMap = {};
            for (const attributeName in gltfAttributeMap) {
                const threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName];
            }
            for (const attributeName in primitive.attributes) {
                const threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                if (gltfAttributeMap[attributeName] !== undefined) {
                    const accessorDef = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[primitive.attributes[attributeName]];
                    if (!!!accessorDef) {
                        continue;
                    }
                    const componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
                    attributeTypeMap[threeAttributeName] = componentType;
                    attributeNormalizedMap[threeAttributeName] =
                        (accessorDef === null || accessorDef === void 0 ? void 0 : accessorDef.normalized) === true;
                }
            }
            const bufferView = yield this.context.getDependency("bufferView", bufferViewIndex);
            const geometry = yield this.context.dracoLoader.decodeDracoFile(bufferView, threeAttributeMap, attributeTypeMap);
            for (const attributeName in geometry.attributes) {
                const attribute = geometry.attributes[attributeName];
                const normalized = attributeNormalizedMap[attributeName];
                if (normalized !== undefined)
                    attribute.normalized = normalized;
            }
            return geometry;
        });
    }
}
//# sourceMappingURL=GLTFDracoMeshCompressionExtension.js.map