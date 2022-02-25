import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
export class GLTFMaterialsVolumeExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;
        this.extendMaterialParams = (materialIndex, materialParams) => {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return Promise.resolve();
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            // TODO: check
            // materialParams.thickness =
            //   extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;
            if (extension.thicknessTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "thicknessMap", extension.thicknessTexture));
            }
            materialParams.attenuationDistance = extension.attenuationDistance || 0;
            const colorArray = extension.attenuationColor || [1, 1, 1];
            materialParams.attenuationColor = new Three.Color(colorArray[0], colorArray[1], colorArray[2]);
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
//# sourceMappingURL=GLTFMaterialsVolumeExtension.js.map