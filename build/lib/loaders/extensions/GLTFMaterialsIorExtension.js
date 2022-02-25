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
export class GLTFMaterialsIorExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_IOR;
        this.extendMaterialParams = (materialIndex, materialParams) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!((_b = materialDef === null || materialDef === void 0 ? void 0 : materialDef.extensions) === null || _b === void 0 ? void 0 : _b[this.name])) {
                return;
            }
            const extension = materialDef.extensions[this.name];
            materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;
            return;
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
//# sourceMappingURL=GLTFMaterialsIorExtension.js.map