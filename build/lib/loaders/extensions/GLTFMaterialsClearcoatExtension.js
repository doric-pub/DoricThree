var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
export class GLTFMaterialsClearcoatExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            if (extension.clearcoatFactor !== undefined) {
                materialParams.clearcoat = extension.clearcoatFactor;
            }
            if (extension.clearcoatTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatMap", extension.clearcoatTexture));
            }
            if (extension.clearcoatRoughnessFactor !== undefined) {
                materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
            }
            if (extension.clearcoatRoughnessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatRoughnessMap", extension.clearcoatRoughnessTexture));
            }
            if (extension.clearcoatNormalTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "clearcoatNormalMap", extension.clearcoatNormalTexture));
                if (extension.clearcoatNormalTexture.scale !== undefined) {
                    const scale = extension.clearcoatNormalTexture.scale;
                    materialParams.clearcoatNormalScale = new Three.Vector2(scale, scale);
                }
            }
            return Promise.all(pending);
        });
    }
    getMaterialType(materialIndex) {
        var _a, _b;
        const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
        if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
            return undefined;
        }
        return Three.MeshPhysicalMaterial;
    }
}
//# sourceMappingURL=GLTFMaterialsClearcoatExtension.js.map