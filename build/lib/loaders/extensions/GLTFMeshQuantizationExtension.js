import { EXTENSIONS, GLTFExtension } from "./GLTFExtensions";
export class GLTFMeshQuantizationExtension extends GLTFExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;
    }
}
//# sourceMappingURL=GLTFMeshQuantizationExtension.js.map