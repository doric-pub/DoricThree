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
import { loge } from "doric/lib/src/util/log";
import * as Three from "three";
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
            const bufferViewIndex = primitive.extensions[this.name].bufferView;
            const extensionAttributes = primitive.extensions[this.name].attributes;
            const threeAttributeMap = {};
            const attributeNormalizedMap = {};
            const attributeTypeMap = {};
            for (const attributeName in extensionAttributes) {
                const lowerCaseName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                threeAttributeMap[lowerCaseName] = extensionAttributes[attributeName];
            }
            for (const attributeName in primitive.attributes) {
                const lowerCaseName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
                if (extensionAttributes[attributeName] !== undefined) {
                    const accessorDef = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[primitive.attributes[attributeName]];
                    if (!!!accessorDef) {
                        loge(this.name, "error: cannot find accessor ", primitive.attributes[attributeName]);
                        continue;
                    }
                    attributeTypeMap[lowerCaseName] = accessorDef.componentType;
                    attributeNormalizedMap[lowerCaseName] =
                        (accessorDef === null || accessorDef === void 0 ? void 0 : accessorDef.normalized) === true;
                }
            }
            const bufferView = yield this.context.getDependency("bufferView", bufferViewIndex);
            const geometry = yield this.decodeDracoFile(bufferView, threeAttributeMap, attributeTypeMap);
            for (const attributeName in geometry.attributes) {
                const attribute = geometry.attributes[attributeName];
                const normalized = attributeNormalizedMap[attributeName];
                if (normalized !== undefined)
                    attribute.normalized = normalized;
            }
            return geometry;
        });
    }
    decodeDracoFile(buffer, attributeIDs, attributeTypes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const ret = (yield this.context.bridgeContext.callNative("draco", "decode", {
                buffer,
                attributeIDs,
                attributeTypes,
            }));
            const geometry = new Three.BufferGeometry();
            const dataView = new DataView(ret);
            let offset = 0;
            const len = dataView.getUint32(offset);
            offset += 4;
            for (let l = 0; l < len; l++) {
                const attributeId = dataView.getUint32(offset);
                offset += 4;
                const name = ((_a = Object.entries(attributeIDs).find(([_, v]) => v === attributeId)) === null || _a === void 0 ? void 0 : _a[0]) ||
                    "";
                const attributeType = attributeTypes[name];
                const arrayType = WEBGL_COMPONENT_TYPES[attributeType];
                const bufferLen = dataView.getUint32(offset);
                offset += 4;
                const arrayBuffer = ret.slice(offset, offset + bufferLen);
                const array = new arrayType(arrayBuffer);
                offset += bufferLen;
                const itemSize = dataView.getUint32(offset);
                offset += 4;
                const attribute = new Three.BufferAttribute(array, itemSize, false);
                geometry.setAttribute(name, attribute);
            }
            if (offset != ret.byteLength) {
                const bufferLen = dataView.getUint32(offset);
                offset += 4;
                const arrayBuffer = ret.slice(offset, offset + bufferLen);
                offset += bufferLen;
                const array = new Uint32Array(arrayBuffer);
                geometry.setIndex(new Three.BufferAttribute(array, 1));
            }
            return geometry;
        });
    }
}
//# sourceMappingURL=GLTFDracoMeshCompressionExtension.js.map