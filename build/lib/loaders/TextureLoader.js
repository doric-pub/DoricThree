var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { imageDecoder } from "doric";
import THREE, { Loader } from "three";
import { UnifiedResource } from "../utils";
export class TextureLoader extends Loader {
    constructor(context, manager) {
        super(manager);
        this.context = context;
    }
    load(res, onLoad, onError) {
        let texture = new THREE.DataTexture();
        texture.format = THREE.RGBAFormat;
        const url = res.url;
        let link;
        if (this.path !== "" && this.path !== undefined) {
            link = this.path + url;
        }
        else {
            link = url;
        }
        const assetsResource = new UnifiedResource(res.type, link);
        const context = this.context;
        (function () {
            return __awaiter(this, void 0, void 0, function* () {
                const imageInfo = yield imageDecoder(context).getImageInfo(assetsResource);
                const imagePixels = yield imageDecoder(context).decodeToPixels(assetsResource);
                texture.image = {
                    data: new Uint8ClampedArray(imagePixels),
                    width: imageInfo.width,
                    height: imageInfo.height,
                };
                texture.needsUpdate = true;
                if (onLoad !== undefined) {
                    onLoad(texture);
                }
            });
        })();
        return texture;
    }
}
//# sourceMappingURL=TextureLoader.js.map