import {
  BridgeContext,
  imageDecoder,
  logw,
  Resource,
  resourceLoader,
  uniqueId,
} from "doric";
import * as Three from "three";
import * as GLTFSpec from "./gltf";

export type GLTF = {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: GLTFSpec.Asset;
  userData: {};
};

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = "glTF";
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };
const EXTENSIONS = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
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

interface GLTFExtension {}

function parseGLB(data: ArrayBuffer) {
  const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
  const header = {
    magic: Three.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
    version: headerView.getUint32(4, true),
    length: headerView.getUint32(8, true),
  };

  if (header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
    throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
  } else if (header.version < 2.0) {
    throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
  }

  const chunkContentsLength = header.length - BINARY_EXTENSION_HEADER_LENGTH;
  const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
  let chunkIndex = 0;
  let content: string | null = null;
  let body: ArrayBuffer | null = null;
  while (chunkIndex < chunkContentsLength) {
    const chunkLength = chunkView.getUint32(chunkIndex, true);
    chunkIndex += 4;

    const chunkType = chunkView.getUint32(chunkIndex, true);
    chunkIndex += 4;

    if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
      const contentArray = new Uint8Array(
        data,
        BINARY_EXTENSION_HEADER_LENGTH + chunkIndex,
        chunkLength
      );
      content = Three.LoaderUtils.decodeText(contentArray);
    } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
      const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
      body = data.slice(byteOffset, byteOffset + chunkLength);
    }

    // Clients must ignore chunks with unknown types.

    chunkIndex += chunkLength;
  }

  if (content === null) {
    throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
  return {
    content,
    body,
  };
}
function assignExtrasToUserData(
  object: { userData: any },
  hasExtras: { extras?: any }
) {
  if (hasExtras.extras !== undefined) {
    if (typeof hasExtras.extras === "object") {
      Object.assign(object.userData, hasExtras.extras);
    } else {
      logw(
        "THREE.GLTFLoader: Ignoring primitive type .extras, " + hasExtras.extras
      );
    }
  }
}

function addUnknownExtensionsToUserData(
  knownExtensions: Record<string, any>,
  object: { userData: any },
  objectDef: { extensions?: any }
) {
  // Add unknown glTF extensions to an object's userData.
  if (typeof objectDef.extensions === "object") {
    for (const name in objectDef.extensions) {
      if (knownExtensions[name] === undefined) {
        object.userData.gltfExtensions = object.userData.gltfExtensions || {};
        object.userData.gltfExtensions[name] = objectDef.extensions[name];
      }
    }
  }
}

export class GLTFLoader extends Three.Loader {
  context: BridgeContext;

  constructor(context: BridgeContext) {
    super();
    this.context = context;
  }

  async loadFile(resource: Resource) {
    const data = await resourceLoader(this.context).load(resource);
    return data;
  }

  async loadTexture(resource: Resource) {
    const imageInfo = await imageDecoder(this.context).getImageInfo(resource);
    const imagePixels = await imageDecoder(this.context).decodeToPixels(
      resource
    );
    const texture = new Three.DataTexture();
    texture.format = Three.RGBAFormat;
    texture.image = {
      data: new Uint8ClampedArray(imagePixels),
      width: imageInfo.width,
      height: imageInfo.height,
    };
    texture.needsUpdate = true;
    return texture;
  }

  async loadMaterial(gltf: GLTFSpec.GLTF, materialIndex: number) {
    const materialDef = gltf.materials!![materialIndex];

    const materialParams: Record<string, any> = {};
    const materialExtensions = materialDef.extensions || {};

    const pending = [];
  }

  async loadMesh(gltf: GLTFSpec.GLTF, index: number) {
    const nodeDef = gltf.nodes!![index];
    const nodeName = nodeDef.name
      ? uniqueId(Three.PropertyBinding.sanitizeNodeName(nodeDef.name || ""))
      : "";
  }
  async loadNode(gltf: GLTFSpec.GLTF, index: number) {
    const nodeDef = gltf.nodes!![index];
    const nodeName = nodeDef.name
      ? uniqueId(Three.PropertyBinding.sanitizeNodeName(nodeDef.name || ""))
      : "";
  }

  async loadScene(gltf: GLTFSpec.GLTF) {
    gltf.scenes?.map((e) => {
      const scene = new Three.Group();
      if (e.name) {
        scene.name = uniqueId(
          Three.PropertyBinding.sanitizeNodeName(e.name || "")
        );
      }
      assignExtrasToUserData(scene, e);
      addUnknownExtensionsToUserData(EXTENSIONS, scene, e);

      return scene;
    });
  }
  async load(resource: Resource) {
    const url = resource.identifier;
    const data = await this.loadFile(resource);

    const magic = Three.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
    let gltf: GLTFSpec.GLTF;
    if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
      const { content, body } = parseGLB(data);
      gltf = JSON.parse(content) as GLTFSpec.GLTF;
    } else {
      const content = Three.LoaderUtils.decodeText(new Uint8Array(data));
      gltf = JSON.parse(content) as GLTFSpec.GLTF;
    }
    if (gltf.asset === undefined || parseInt(gltf.asset.version) < 2) {
      throw new Error(
        "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."
      );
    }
  }
}
