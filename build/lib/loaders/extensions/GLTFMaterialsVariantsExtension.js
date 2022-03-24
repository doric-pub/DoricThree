var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, GLTFExtension } from "./GLTFExtensions";
export class GLTFMaterialsVariantsExtension extends GLTFExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_VARIANTS;
        this.variants = [];
        this.variantCallback = [];
        this.markRefs = () => {
            var _a, _b;
            const variants = (_b = (_a = this.gltf.extensions) === null || _a === void 0 ? void 0 : _a[this.name]) === null || _b === void 0 ? void 0 : _b["variants"];
            if (!!!variants) {
                return;
            }
            this.variants = variants;
        };
    }
    changeVariant(index) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let callback of this.variantCallback) {
                yield callback(index);
            }
        });
    }
}
//# sourceMappingURL=GLTFMaterialsVariantsExtension.js.map