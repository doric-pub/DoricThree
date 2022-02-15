import {
  AssetsResource,
  BridgeContext,
  imageDecoder,
  resourceLoader,
} from "doric";
import THREE, { Loader, LoadingManager } from "three";

class TextureLoader extends Loader {
  context: BridgeContext;
  constructor(context: BridgeContext, manager?: LoadingManager) {
    super(manager);
    this.context = context;
  }

  load(url: string, onLoad: Function, onProgress: Function, onError: Function) {
    let texture = new THREE.DataTexture();
    texture.format = THREE.RGBAFormat;

    let link;
    if (this.path !== "" && this.path !== undefined) {
      link = this.path + url;
    } else {
      link = url;
    }

    const assetsResource = new AssetsResource(link);
    resourceLoader(this.context)
      .load(assetsResource)
      .then(async (arrayBuffer) => {
        const imageInfo = await imageDecoder(this.context).getImageInfo(
          assetsResource
        );
        const imagePixels = await imageDecoder(this.context).decodeToPixels(
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
      })
      .catch((reason) => {
        onError();
      });

    return texture;
  }
}

export { TextureLoader };
