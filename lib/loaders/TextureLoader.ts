import { BridgeContext, imageDecoder } from "doric";
import THREE, { Loader, LoadingManager } from "three";
import { UnifiedResource } from "../utils";

export class TextureLoader extends Loader {
  context: BridgeContext;
  constructor(context: BridgeContext, manager?: LoadingManager) {
    super(manager);
    this.context = context;
  }

  load(
    res: { url: string; type: string },
    onLoad: Function,
    onError: Function
  ) {
    let texture = new THREE.DataTexture();
    texture.format = THREE.RGBAFormat;
    const url = res.url;
    let link;
    if (this.path !== "" && this.path !== undefined) {
      link = this.path + url;
    } else {
      link = url;
    }
    const assetsResource = new UnifiedResource(res.type, link);
    const context = this.context;
    (async function () {
      const imageInfo = await imageDecoder(context).getImageInfo(
        assetsResource
      );
      const imagePixels = await imageDecoder(context).decodeToPixels(
        assetsResource
      );

      texture.image = {
        data: new Uint8ClampedArray(imagePixels),
        width: imageInfo.width,
        height: imageInfo.height,
      };

      texture.needsUpdate = true;

      if (onLoad !== undefined) {
        onLoad(texture);
      }
    })();
    return texture;
  }
}
