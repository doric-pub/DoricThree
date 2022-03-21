import { loge, Resource } from "doric";
import * as Three from "three";
import { GLTFContext } from "./extensions/GLTFExtensions";

const KTX2TransferSRGB = 2;
const KTX2_ALPHA_PREMULTIPLIED = 1;

const EngineFormat = [
  Three.RGBAFormat,
  Three.RGBA_ASTC_4x4_Format,
  Three.RGBA_BPTC_Format,
  Three.RGBA_ETC2_EAC_Format,
  Three.RGBA_PVRTC_4BPPV1_Format,
  Three.RGBA_S3TC_DXT5_Format,
  Three.RGB_ETC1_Format,
  Three.RGB_ETC2_Format,
  Three.RGB_PVRTC_4BPPV1_Format,
  Three.RGB_S3TC_DXT1_Format,
];
export class KTX2Loader {
  extensionFlag: number;
  constructor(renderer: Three.WebGLRenderer) {
    const config = {
      astcSupported: renderer.extensions.has("WEBGL_compressed_texture_astc"),
      etc1Supported: renderer.extensions.has("WEBGL_compressed_texture_etc1"),
      etc2Supported: renderer.extensions.has("WEBGL_compressed_texture_etc"),
      dxtSupported: renderer.extensions.has("WEBGL_compressed_texture_s3tc"),
      bptcSupported: renderer.extensions.has("EXT_texture_compression_bptc"),
      pvrtcSupported:
        renderer.extensions.has("WEBGL_compressed_texture_pvrtc") ||
        renderer.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc"),
    };
    this.extensionFlag =
      (config.astcSupported ? 0x1 : 0) |
      (config.etc1Supported ? 0x1 << 1 : 0) |
      (config.etc2Supported ? 0x1 << 2 : 0) |
      (config.dxtSupported ? 0x1 << 3 : 0) |
      (config.bptcSupported ? 0x1 << 4 : 0) |
      (config.pvrtcSupported ? 0x1 << 5 : 0);
  }
  async loadTexture(
    context: GLTFContext,
    resource: Resource
  ): Promise<Three.Texture | undefined> {
    const arrayBuffer: ArrayBuffer = await context.bridgeContext.callNative(
      "ktx2",
      "decode",
      {
        resource,
        extensionFlag: this.extensionFlag,
      }
    );
    const dataView = new DataView(arrayBuffer);
    let offset = 0;
    const width = dataView.getUint32(offset);
    offset += 4;
    const height = dataView.getUint32(offset);
    offset += 4;
    const hasAlpha = dataView.getUint32(offset) === 1;
    offset += 4;
    const format = EngineFormat[dataView.getUint32(offset)];
    offset += 4;
    const dfdTransferFn = dataView.getUint32(offset);
    offset += 4;
    const dfdFlags = dataView.getUint32(offset);
    offset += 4;
    const levels = dataView.getUint32(offset);
    offset += 4;
    const mipmaps = [];
    for (let i = 0; i < levels; i++) {
      const mipWidth = dataView.getUint32(offset);
      offset += 4;
      const mipHeight = dataView.getUint32(offset);
      offset += 4;
      const bufferLen = dataView.getUint32(offset);
      offset += 4;
      const data = arrayBuffer.slice(offset, offset + bufferLen);
      mipmaps.push({
        data: new Uint8Array(data),
        width: mipWidth,
        height: mipHeight,
      });
    }

    const texture = new Three.CompressedTexture(
      mipmaps as unknown as ImageData[],
      width,
      height,
      format as Three.CompressedPixelFormat,
      Three.UnsignedByteType
    );
    texture.minFilter =
      mipmaps.length === 1
        ? Three.LinearFilter
        : Three.LinearMipmapLinearFilter;
    texture.magFilter = Three.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.encoding =
      dfdTransferFn === KTX2TransferSRGB
        ? Three.sRGBEncoding
        : Three.LinearEncoding;
    texture.premultiplyAlpha = !!(dfdFlags & KTX2_ALPHA_PREMULTIPLIED);
    return texture;
  }
}
