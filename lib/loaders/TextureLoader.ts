import { Resource, imageDecoder, BridgeContext } from "doric";
import { DataTexture, RGBAFormat } from "three";

export class TextureLoader {
  async load(context: BridgeContext, resource: Resource) {
    const texture = new DataTexture();
    texture.format = RGBAFormat;
    const imageInfo = await imageDecoder(context).getImageInfo(resource);
    const imagePixels = await imageDecoder(context).decodeToPixels(resource);
    texture.image = {
      data: new Uint8ClampedArray(imagePixels),
      width: imageInfo.width,
      height: imageInfo.height,
    };
    texture.needsUpdate = true;
    return texture;
  }
}
