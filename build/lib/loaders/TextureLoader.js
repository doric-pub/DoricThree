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
import { DataTexture, RGBAFormat } from "three";
export class TextureLoader {
    load(context, resource) {
        return __awaiter(this, void 0, void 0, function* () {
            const texture = new DataTexture();
            texture.format = RGBAFormat;
            const imageInfo = yield imageDecoder(context).getImageInfo(resource);
            const imagePixels = yield imageDecoder(context).decodeToPixels(resource);
            texture.image = {
                data: new Uint8ClampedArray(imagePixels),
                width: imageInfo.width,
                height: imageInfo.height,
            };
            texture.needsUpdate = true;
            return texture;
        });
    }
}
//# sourceMappingURL=TextureLoader.js.map