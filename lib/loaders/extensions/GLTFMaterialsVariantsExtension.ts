import { loge } from "doric/lib/src/util/log";
import { EXTENSIONS, GLTFExtension } from "./GLTFExtensions";

export class GLTFMaterialsVariantsExtension extends GLTFExtension {
  name = EXTENSIONS.KHR_MATERIALS_VARIANTS;
  variants: { name: string }[] = [];
  variantCallback: Array<(variantIndex: number) => Promise<void>> = [];

  markRefs = () => {
    const variants = this.gltf.extensions?.[this.name]?.["variants"];
    if (!!!variants) {
      return;
    }
    this.variants = variants;
  };

  async changeVariant(index: number) {
    for (let callback of this.variantCallback) {
      await callback(index);
    }
  }
}
