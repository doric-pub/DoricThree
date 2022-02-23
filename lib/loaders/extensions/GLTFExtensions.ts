import * as GSpec from "../glTF";
import * as Three from "three";

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
};

export type GLTFContext = {
  gltf: GSpec.GLTF;
  createUniqueName(n: string): string;
  addCache(n: string, v: Promise<any>): void;
  getCache(n: string): Promise<any> | undefined;
  assignTexture(
    materialParams: Three.MaterialParameters,
    mapName: string,
    mapDef: any
  ): Promise<Three.Texture>;
  ktx2Loader?: Three.Loader;
  loadTextureImage(
    index: number,
    source: GSpec.Image,
    loader: Three.Loader
  ): Promise<Three.Texture>;
  loadBuffer(index: number): Promise<ArrayBuffer>;
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
  ): Promise<Three.BufferGeometry>;
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
  ) => Promise<Three.Texture[]> | Promise<void>;
}

export abstract class TextureExtension extends GLTFExtension {
  abstract loadTexture(
    textureIndex: number
  ): Promise<Three.Texture> | Promise<void>;
}

export abstract class TextureExtraExtension extends GLTFExtension {
  abstract extendTexture(texture: Three.Texture, extra: any): Three.Texture;
}

export abstract class BufferViewExtension extends GLTFExtension {
  abstract loadBufferView(index: number): Promise<ArrayBuffer | void>;
}
