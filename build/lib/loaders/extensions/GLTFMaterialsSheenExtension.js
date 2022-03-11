import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
export class GLTFMaterialsSheenExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;
        this.extendMaterialParams = (materialIndex, materialParams) => {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return Promise.resolve();
            }
            const pending = [];
            materialParams.sheenColor = new Three.Color(0, 0, 0);
            materialParams.sheenRoughness = 0;
            materialParams.sheen = 1;
            const extension = materialDef.extensions[this.name];
            if (extension.sheenColorFactor !== undefined) {
                materialParams.sheenColor.fromArray(extension.sheenColorFactor);
            }
            if (extension.sheenRoughnessFactor !== undefined) {
                materialParams.sheenRoughness = extension.sheenRoughnessFactor;
            }
            if (extension.sheenColorTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "sheenColorMap", extension.sheenColorTexture));
            }
            if (extension.sheenRoughnessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "sheenRoughnessMap", extension.sheenRoughnessTexture));
            }
            return Promise.all(pending);
        };
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
//# sourceMappingURL=GLTFMaterialsSheenExtension.js.map