import { EXTENSIONS, BufferViewExtension } from "./GLTFExtensions";

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
export class GLTFMeshoptCompressionExtension extends BufferViewExtension {
  name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;

  async loadBufferView(index: number) {
    const bufferView = this.gltf.bufferViews?.[index];
    if (
      bufferView &&
      bufferView.extensions &&
      bufferView.extensions[this.name]
    ) {
      const extensionDef = bufferView.extensions[this.name];

      const decoder = this.context.meshoptDecoder;

      if (!decoder || !decoder.supported) {
        if (
          this.gltf.extensionsRequired &&
          this.gltf.extensionsRequired.indexOf(this.name) >= 0
        ) {
          throw new Error(
            "THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files"
          );
        } else {
          // Assumes that the extension is optional and that fallback buffer data is present
          return;
        }
      }
      const raw = await this.context.loadBuffer(extensionDef.buffer);
      if (!!!raw) {
        throw new Error("THREE.GLTFLoader: load meshopt decoder error");
      }
      await decoder.ready();
      const byteOffset = extensionDef.byteOffset || 0;
      const byteLength = extensionDef.byteLength || 0;
      const count = extensionDef.count;
      const stride = extensionDef.byteStride;
      const source = new Uint8Array(raw, byteOffset, byteLength);
      const result = await decoder.decode(
        source,
        count,
        stride,
        extensionDef.mode,
        extensionDef.filter
      );
      return result;
    }
  }
}
