import * as GSpec from "../glTF";
import * as Three from "three";
import { BridgeContext } from "doric";
import { KTX2Loader } from "../KTX2Loader";

export const EXTENSIONS = {
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: "KHR_materials_pbrSpecularGlossiness",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  //MISSED in Three
  KHR_MATERIALS_VARIANTS: "KHR_materials_variants",
};
export type GLTFDepsType =
  | "scene"
  | "node"
  | "mesh"
  | "accessor"
  | "bufferView"
  | "buffer"
  | "material"
  | "texture"
  | "skin"
  | "animation"
  | "camera";

export const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

export const WEBGL_FILTERS = {
  9728: Three.NearestFilter,
  9729: Three.LinearFilter,
  9984: Three.NearestMipmapNearestFilter,
  9985: Three.LinearMipmapNearestFilter,
  9986: Three.NearestMipmapLinearFilter,
  9987: Three.LinearMipmapLinearFilter,
};

export const WEBGL_WRAPPINGS = {
  33071: Three.ClampToEdgeWrapping,
  33648: Three.MirroredRepeatWrapping,
  10497: Three.RepeatWrapping,
};

export const ATTRIBUTES: Record<string, string> = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv2",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex",
};

export type ValueOf<T> = T[keyof T];
export type ParseOption = {
  gltf: GSpec.GLTF;
  bridgeContext: BridgeContext;
  path: string;
  resType: string;
  body?: ArrayBuffer;
  asyncTexture?: boolean;
};
export type GLTFContext = {
  gltf: GSpec.GLTF;
  bridgeContext: BridgeContext;
  associations: Map<
    Three.Object3D | Three.EventDispatcher,
    { index: number; primitives?: number } | undefined
  >;
  option: ParseOption;
  _addNodeRef(
    cache: { refs: Record<number, number>; uses: Record<number, number> },
    index: number
  ): void;
  addCache(n: string, v: Promise<any>): void;
  getCache(n: string): Promise<any> | undefined;
  assignTexture(
    materialParams: Three.MaterialParameters,
    mapName: string,
    mapDef: any
  ): Promise<Three.Texture | undefined>;
  loadTextureImage(
    index: number,
    source: GSpec.Image
  ): Promise<Three.Texture | undefined>;
  loadBuffer(index: number): Promise<ArrayBuffer | undefined>;
  getDependency<T>(type: GLTFDepsType, index: number): Promise<T>;
  meshoptDecoder?: {
    ready: () => Promise<void>;
    supported: boolean;
    decode: (
      source: Uint8Array,
      count: number,
      stride: number,
      mode: any,
      filter: any
    ) => Promise<ArrayBuffer>;
  };
  ktx2Loader?: KTX2Loader;
};

export abstract class GLTFExtension {
  abstract name: string;
  context: GLTFContext;
  constructor(context: GLTFContext) {
    this.context = context;
  }
  markRefs?: () => void;
  beforeRoot?: () => void;
  afterRoot?: () => void;

  get gltf() {
    return this.context.gltf;
  }
}

export abstract class PremitiveExtension extends GLTFExtension {
  abstract decodePrimitive(
    primitive: GSpec.MeshPrimitive
  ): Promise<Three.BufferGeometry | undefined>;
}

export abstract class AttachmentExtension extends GLTFExtension {
  abstract createNodeAttachment(index: number): Promise<Three.Object3D>;
}

export type MaterialClass = new (
  params: Three.MaterialParameters
) => Three.Material;

export abstract class MeshExtension extends GLTFExtension {
  abstract getMaterialType(index: number): MaterialClass | undefined;

  createMaterial?: (params: Three.MaterialParameters) => Three.Material;

  extendParams?: (
    params: Three.MaterialParameters,
    materialDef: GSpec.Material
  ) => void;

  extendMaterialParams?: (
    index: number,
    params: Three.MaterialParameters
  ) => Promise<(Three.Texture | void)[] | void>;
}

export abstract class TextureExtension extends GLTFExtension {
  abstract loadTexture(textureIndex: number): Promise<Three.Texture | void>;
}

export abstract class TextureExtraExtension extends GLTFExtension {
  abstract extendTexture(texture: Three.Texture, extra: any): Three.Texture;
}

export abstract class BufferViewExtension extends GLTFExtension {
  abstract loadBufferView(index: number): Promise<ArrayBuffer | undefined>;
}
