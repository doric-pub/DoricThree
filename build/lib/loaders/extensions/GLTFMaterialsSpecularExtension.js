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
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
export class GLTFMaterialsSpecularExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const pending = [];
            const extension = materialDef.extensions[this.name];
            materialParams.specularIntensity =
                extension.specularFactor !== undefined ? extension.specularFactor : 1.0;
            if (extension.specularTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "specularIntensityMap", extension.specularTexture));
            }
            const colorArray = extension.specularColorFactor || [1, 1, 1];
            materialParams.specularColor = new Three.Color(colorArray[0], colorArray[1], colorArray[2]);
            if (extension.specularColorTexture !== undefined) {
                pending.push(this.context
                    .assignTexture(materialParams, "specularColorMap", extension.specularColorTexture)
                    .then((texture) => {
                    if (texture) {
                        texture.encoding = Three.sRGBEncoding;
                    }
                    return texture;
                }));
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
//# sourceMappingURL=GLTFMaterialsSpecularExtension.js.map