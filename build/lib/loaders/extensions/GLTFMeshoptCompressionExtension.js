var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, BufferViewExtension } from "./GLTFExtensions";
/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
export class GLTFMeshoptCompressionExtension extends BufferViewExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
    }
    loadBufferView(index) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bufferView = (_a = this.gltf.bufferViews) === null || _a === void 0 ? void 0 : _a[index];
            if (bufferView &&
                bufferView.extensions &&
                bufferView.extensions[this.name]) {
                const extensionDef = bufferView.extensions[this.name];
                const decoder = this.context.meshoptDecoder;
                if (!decoder || !decoder.supported) {
                    if (this.gltf.extensionsRequired &&
                        this.gltf.extensionsRequired.indexOf(this.name) >= 0) {
                        throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
                    }
                    else {
                        // Assumes that the extension is optional and that fallback buffer data is present
                        return;
                    }
                }
                const raw = yield this.context.loadBuffer(extensionDef.buffer);
                if (!!!raw) {
                    throw new Error("THREE.GLTFLoader: load meshopt decoder error");
                }
                yield decoder.ready();
                const byteOffset = extensionDef.byteOffset || 0;
                const byteLength = extensionDef.byteLength || 0;
                const count = extensionDef.count;
                const stride = extensionDef.byteStride;
                const source = new Uint8Array(raw, byteOffset, byteLength);
                const result = yield decoder.decode(source, count, stride, extensionDef.mode, extensionDef.filter);
                return result;
            }
        });
    }
}
//# sourceMappingURL=GLTFMeshoptCompressionExtension.js.map