import {
  BridgeContext,
  imageDecoder,
  loge,
  logw,
  Resource,
  resourceLoader,
  uniqueId,
} from "doric";
import * as Three from "three";
import { UnifiedResource } from "../utils";
import { GLTFDracoMeshCompressionExtension } from "./extensions/GLTFDracoMeshCompressionExtension";
import {
  AttachmentExtension,
  ATTRIBUTES,
  BufferViewExtension,
  EXTENSIONS,
  GLTFDepsType,
  GLTFExtension,
  MeshExtension,
  ValueOf,
  WEBGL_COMPONENT_TYPES,
} from "./extensions/GLTFExtensions";
import {
  GLTFMaterialsPbrSpecularGlossinessExtension,
  GLTFMeshStandardSGMaterial,
} from "./extensions/GLTFMaterialsPbrSpecularGlossinessExtension";
import { GLTFMaterialsUnlitExtension } from "./extensions/GLTFMaterialsUnlitExtension";
import { GLTFTextureTransformExtension } from "./extensions/GLTFTextureTransformExtension";
import * as GSpec from "./gltf";

export type GLTF = {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: GSpec.Asset;
  userData: {};
};

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = "glTF";
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4e4f534a, BIN: 0x004e4942 };

/* CONSTANTS */

const WEBGL_CONSTANTS = {
  FLOAT: 5126,
  //FLOAT_MAT2: 35674,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123,
};

const WEBGL_FILTERS = {
  9728: Three.NearestFilter,
  9729: Three.LinearFilter,
  9984: Three.NearestMipmapNearestFilter,
  9985: Three.LinearMipmapNearestFilter,
  9986: Three.NearestMipmapLinearFilter,
  9987: Three.LinearMipmapLinearFilter,
};

const WEBGL_WRAPPINGS = {
  33071: Three.ClampToEdgeWrapping,
  33648: Three.MirroredRepeatWrapping,
  10497: Three.RepeatWrapping,
};

const WEBGL_TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const PATH_PROPERTIES = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences",
};

const INTERPOLATION = {
  CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: Three.InterpolateLinear,
  STEP: Three.InterpolateDiscrete,
};

const ALPHA_MODES = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND",
};

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets(
  mesh:
    | Three.Mesh
    | Three.LineSegments
    | Three.Line
    | Three.LineLoop
    | Three.Points,
  meshDef: GSpec.Mesh
) {
  mesh.updateMorphTargets();

  if (meshDef.weights !== undefined && !!mesh.morphTargetInfluences) {
    for (let i = 0, il = meshDef.weights.length; i < il; i++) {
      mesh.morphTargetInfluences[i] = meshDef.weights[i];
    }
  }

  // .extras has user-defined data, so check that .extras.targetNames is an array.
  if (
    meshDef.extras &&
    Array.isArray(meshDef.extras.targetNames) &&
    !!mesh.morphTargetInfluences
  ) {
    const targetNames = meshDef.extras.targetNames;

    if (mesh.morphTargetInfluences.length === targetNames.length) {
      mesh.morphTargetDictionary = {};

      for (let i = 0, il = targetNames.length; i < il; i++) {
        mesh.morphTargetDictionary[targetNames[i]] = i;
      }
    } else {
      logw(
        "THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names."
      );
    }
  }
}
/**
 * @param {BufferGeometry} geometry
 * @param {Number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode(geometry: Three.BufferGeometry, drawMode: number) {
  let index = geometry.getIndex();

  // generate index if not present

  if (index === null) {
    const indices = [];

    const position = geometry.getAttribute("position");

    if (position !== undefined) {
      for (let i = 0; i < position.count; i++) {
        indices.push(i);
      }

      geometry.setIndex(indices);
      index = geometry.getIndex();
    }
    if (index === null) {
      loge(
        "THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."
      );
      return geometry;
    }
  }

  //

  const numberOfTriangles = index.count - 2;
  const newIndices = [];

  if (drawMode === Three.TriangleFanDrawMode) {
    // gl.TRIANGLE_FAN

    for (let i = 1; i <= numberOfTriangles; i++) {
      newIndices.push(index.getX(0));
      newIndices.push(index.getX(i));
      newIndices.push(index.getX(i + 1));
    }
  } else {
    // gl.TRIANGLE_STRIP

    for (let i = 0; i < numberOfTriangles; i++) {
      if (i % 2 === 0) {
        newIndices.push(index.getX(i));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i + 2));
      } else {
        newIndices.push(index.getX(i + 2));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i));
      }
    }
  }

  if (newIndices.length / 3 !== numberOfTriangles) {
    loge(
      "THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles."
    );
  }

  // build final geometry

  const newGeometry = geometry.clone();
  newGeometry.setIndex(newIndices);

  return newGeometry;
}

function createAttributesKey(attributes: any) {
  let attributesKey = "";

  const keys = Object.keys(attributes).sort();

  for (let i = 0, il = keys.length; i < il; i++) {
    attributesKey += keys[i] + ":" + attributes[keys[i]] + ";";
  }

  return attributesKey;
}

/** When Object3D instances are targeted by animation, they need unique names. */
function createUniqueName(originalName?: string) {
  const sanitizedName = Three.PropertyBinding.sanitizeNodeName(
    originalName || ""
  );
  return uniqueId(sanitizedName);
}

function createPrimitiveKey(primitiveDef: GSpec.MeshPrimitive) {
  const dracoExtension =
    primitiveDef.extensions &&
    primitiveDef.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
  let geometryKey;

  if (dracoExtension) {
    geometryKey =
      "draco:" +
      dracoExtension.bufferView +
      ":" +
      dracoExtension.indices +
      ":" +
      createAttributesKey(dracoExtension.attributes);
  } else {
    geometryKey =
      primitiveDef.indices +
      ":" +
      createAttributesKey(primitiveDef.attributes) +
      ":" +
      primitiveDef.mode;
  }

  return geometryKey;
}

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

let defaultMaterial: Three.MeshStandardMaterial | undefined = undefined;
/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial(): Three.MeshStandardMaterial {
  if (defaultMaterial === undefined) {
    defaultMaterial = new Three.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      metalness: 1,
      roughness: 1,
      transparent: false,
      depthTest: true,
      side: Three.FrontSide,
    });
  }
  return defaultMaterial;
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

  async readTexture(resource: Resource) {
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
  extensions: Record<string, GLTFExtension> = {};

  async load(resource: Resource) {
    const url = resource.identifier;
    const data = await this.loadFile(resource);

    const magic = Three.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
    let gltf: GSpec.GLTF;
    if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
      const { content, body } = parseGLB(data);
      gltf = JSON.parse(content) as GSpec.GLTF;
    } else {
      const content = Three.LoaderUtils.decodeText(new Uint8Array(data));
      gltf = JSON.parse(content) as GSpec.GLTF;
    }
    if (gltf.asset === undefined || parseInt(gltf.asset.version) < 2) {
      throw new Error(
        "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."
      );
    }
  }
}
type ParseOption = {
  path: string;
  resType: string;
};

function getNormalizedComponentScale(
  constructor: ValueOf<typeof WEBGL_COMPONENT_TYPES>
) {
  // Reference:
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

  switch (constructor) {
    case Int8Array:
      return 1 / 127;

    case Uint8Array:
      return 1 / 255;

    case Int16Array:
      return 1 / 32767;

    case Uint16Array:
      return 1 / 65535;

    default:
      throw new Error(
        "THREE.GLTFLoader: Unsupported normalized accessor component type."
      );
  }
}
class GLTFParser {
  gltf: GSpec.GLTF;
  textureCache: Record<string, Three.Texture> = {};
  option: ParseOption;
  context: BridgeContext;
  associations: Map<
    Three.Object3D | Three.EventDispatcher,
    { index: number; primitives?: number } | undefined
  > = new Map();
  cache: Map<
    string,
    | Three.Object3D
    | Three.EventDispatcher
    | Three.InterleavedBuffer
    | Three.BufferAttribute
    | Three.InterleavedBufferAttribute
    | ArrayBuffer
    | {
        joints: number[];
        inverseBindMatrices?:
          | Three.BufferAttribute
          | Three.InterleavedBufferAttribute
          | undefined;
      }
  > = new Map();

  meshCache = { refs: {}, uses: {} };
  cameraCache = { refs: {}, uses: {} };

  extensions: Record<string, GLTFExtension> = {};
  primitiveCache: Record<string, any> = {};

  constructor(context: BridgeContext, gltf: GSpec.GLTF, option: ParseOption) {
    this.context = context;
    this.gltf = gltf;
    this.option = option;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  async loadAccessor(accessorIndex: number) {
    const accessorDef = this.gltf.accessors?.[accessorIndex];
    if (!!!accessorDef) {
      return;
    }
    if (
      accessorDef.bufferView === undefined &&
      accessorDef.sparse === undefined
    ) {
      // Ignore empty accessors, which may be used to declare runtime
      // information about attributes coming from another source (e.g. Draco
      // compression extension).
      return;
    }

    const pendingBufferViews: Promise<ArrayBuffer>[] = [];

    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(
        this.getDependency<ArrayBuffer>("bufferView", accessorDef.bufferView)
      );
    }

    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(
        this.getDependency<ArrayBuffer>(
          "bufferView",
          accessorDef.sparse.indices.bufferView
        )
      );
      pendingBufferViews.push(
        this.getDependency<ArrayBuffer>(
          "bufferView",
          accessorDef.sparse.values.bufferView
        )
      );
    }
    const bufferViews = await Promise.all(pendingBufferViews);

    const bufferView = bufferViews[0];

    const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
    const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

    // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
    const elementBytes = TypedArray.BYTES_PER_ELEMENT;
    const itemBytes = elementBytes * itemSize;
    const byteOffset = accessorDef.byteOffset || 0;
    const byteStride =
      accessorDef.bufferView !== undefined
        ? this.gltf.bufferViews?.[accessorDef.bufferView].byteStride
        : undefined;
    const normalized = accessorDef.normalized === true;
    let array,
      bufferAttribute: Three.InterleavedBufferAttribute | Three.BufferAttribute;

    // The buffer is not interleaved if the stride is the item size in bytes.
    if (byteStride && byteStride !== itemBytes) {
      // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
      // This makes sure that IBA.count reflects accessor.count properly
      const ibSlice = Math.floor(byteOffset / byteStride);
      const ibCacheKey =
        "InterleavedBuffer:" +
        accessorDef.bufferView +
        ":" +
        accessorDef.componentType +
        ":" +
        ibSlice +
        ":" +
        accessorDef.count;
      let ib: Three.InterleavedBuffer | undefined = this.cache.get(
        ibCacheKey
      ) as Three.InterleavedBuffer;

      if (!ib) {
        array = new TypedArray(
          bufferView,
          ibSlice * byteStride,
          (accessorDef.count * byteStride) / elementBytes
        );

        // Integer parameters to IB/IBA are in array elements, not bytes.
        ib = new Three.InterleavedBuffer(array, byteStride / elementBytes);

        this.cache.set(ibCacheKey, ib);
      }

      bufferAttribute = new Three.InterleavedBufferAttribute(
        ib,
        itemSize,
        (byteOffset % byteStride) / elementBytes,
        normalized
      );
    } else {
      if (bufferView === null) {
        array = new TypedArray(accessorDef.count * itemSize);
      } else {
        array = new TypedArray(
          bufferView,
          byteOffset,
          accessorDef.count * itemSize
        );
      }

      bufferAttribute = new Three.BufferAttribute(array, itemSize, normalized);
    }

    // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
    if (accessorDef.sparse !== undefined) {
      const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
      const TypedArrayIndices =
        WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];

      const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
      const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

      const sparseIndices = new TypedArrayIndices(
        bufferViews[1],
        byteOffsetIndices,
        accessorDef.sparse.count * itemSizeIndices
      );
      const sparseValues = new TypedArray(
        bufferViews[2],
        byteOffsetValues,
        accessorDef.sparse.count * itemSize
      );

      if (!!bufferView) {
        // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
        bufferAttribute = new Three.BufferAttribute(
          (bufferAttribute.array as Array<number>).slice(),
          bufferAttribute.itemSize,
          bufferAttribute.normalized
        );
      }

      for (let i = 0, il = sparseIndices.length; i < il; i++) {
        const index = sparseIndices[i];

        bufferAttribute.setX(index, sparseValues[i * itemSize]);
        if (itemSize >= 2)
          bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
        if (itemSize >= 3)
          bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
        if (itemSize >= 4)
          bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
        if (itemSize >= 5)
          throw new Error(
            "THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute."
          );
      }
    }
    return bufferAttribute;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */
  async loadBufferView(bufferViewIndex: number) {
    const bufferViewDef = this.gltf.bufferViews?.[bufferViewIndex];
    if (!!!bufferViewDef) {
      return;
    }
    let buffer: ArrayBuffer | void = await this.getDependency<ArrayBuffer>(
      "buffer",
      bufferViewDef.buffer
    );
    if (!!!buffer) {
      for (const extension of Object.values(this.extensions)) {
        if (extension instanceof BufferViewExtension) {
          buffer = await extension.loadBufferView(bufferViewIndex);
          if (!!buffer) {
            break;
          }
        }
      }
    }
    if (!!!buffer) {
      return;
    }
    const byteLength = bufferViewDef.byteLength || 0;
    const byteOffset = bufferViewDef.byteOffset || 0;
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */
  async loadBuffer(bufferIndex: number) {
    const bufferDef = this.gltf.buffers?.[bufferIndex];
    if (!!!bufferDef) {
      return undefined;
    }
    if (bufferDef.type && bufferDef.type !== "arraybuffer") {
      throw new Error(
        "THREE.GLTFLoader: " + bufferDef.type + " buffer type is not supported."
      );
    }

    // If present, GLB container is required to be the first buffer.
    if (bufferDef.uri === undefined && bufferIndex === 0) {
      return this.cache.get(`buffer:${bufferIndex}`);
    }
    const resource = new UnifiedResource(
      this.option.resType,
      Three.LoaderUtils.resolveURL(bufferDef.uri || "", this.option.path)
    );
    const data = await resourceLoader(this.context).load(resource);
    return data;
  }

  /**
   * @param {BufferGeometry} geometry
   * @param {GLTF.Primitive} primitiveDef
   * @param {GLTFParser} parser
   */
  computeBounds(
    geometry: Three.BufferGeometry,
    primitiveDef: GSpec.MeshPrimitive
  ) {
    const attributes = primitiveDef.attributes;

    const box = new Three.Box3();

    if (attributes.POSITION !== undefined) {
      const accessor = this.gltf.accessors?.[attributes.POSITION];
      if (!!!accessor) {
        return;
      }
      const min = accessor.min;
      const max = accessor.max;

      // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

      if (min !== undefined && max !== undefined) {
        box.set(
          new Three.Vector3(min[0], min[1], min[2]),
          new Three.Vector3(max[0], max[1], max[2])
        );

        if (accessor.normalized) {
          const boxScale = getNormalizedComponentScale(
            WEBGL_COMPONENT_TYPES[accessor.componentType]
          );
          box.min.multiplyScalar(boxScale);
          box.max.multiplyScalar(boxScale);
        }
      } else {
        logw(
          "THREE.GLTFLoader: Missing min/max properties for accessor POSITION."
        );
        return;
      }
    } else {
      return;
    }

    const targets = primitiveDef.targets;

    if (targets !== undefined) {
      const maxDisplacement = new Three.Vector3();
      const vector = new Three.Vector3();

      for (let i = 0, il = targets.length; i < il; i++) {
        const target = targets[i];

        if (target.POSITION !== undefined) {
          const accessor = this.gltf.accessors?.[target.POSITION];
          if (!!!accessor) {
            continue;
          }
          const min = accessor.min;
          const max = accessor.max;

          // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

          if (min !== undefined && max !== undefined) {
            // we need to get max of absolute components because target weight is [-1,1]
            vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
            vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
            vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));

            if (accessor.normalized) {
              const boxScale = getNormalizedComponentScale(
                WEBGL_COMPONENT_TYPES[accessor.componentType]
              );
              vector.multiplyScalar(boxScale);
            }

            // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
            // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
            // are used to implement key-frame animations and as such only two are active at a time - this results in very large
            // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
            maxDisplacement.max(vector);
          } else {
            logw(
              "THREE.GLTFLoader: Missing min/max properties for accessor POSITION."
            );
          }
        }
      }

      // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
      box.expandByVector(maxDisplacement);
    }

    geometry.boundingBox = box;

    const sphere = new Three.Sphere();

    box.getCenter(sphere.center);
    sphere.radius = box.min.distanceTo(box.max) / 2;

    geometry.boundingSphere = sphere;
  }

  /**
   * @param {BufferGeometry} geometry
   * @param {GLTF.Primitive} primitiveDef
   * @param {GLTFParser} parser
   * @return {Promise<BufferGeometry>}
   */
  async addPrimitiveAttributes(
    geometry: Three.BufferGeometry,
    primitiveDef: GSpec.MeshPrimitive
  ) {
    const attributes = primitiveDef.attributes;

    const pending: Promise<any>[] = [];

    const assignAttributeAccessor = async (
      accessorIndex: number,
      attributeName: string
    ) => {
      const accessor = await this.getDependency<
        Three.BufferAttribute | Three.InterleavedBufferAttribute
      >("accessor", accessorIndex);
      geometry.setAttribute(attributeName, accessor);
    };
    for (const gltfAttributeName in attributes) {
      const threeAttributeName =
        ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();

      // Skip attributes already provided by e.g. Draco extension.
      if (threeAttributeName in geometry.attributes) continue;

      pending.push(
        assignAttributeAccessor(
          attributes[gltfAttributeName],
          threeAttributeName
        )
      );
    }

    if (primitiveDef.indices !== undefined && !geometry.index) {
      const accessor = this.getDependency<Three.BufferAttribute>(
        "accessor",
        primitiveDef.indices
      ).then((accessor) => {
        geometry.setIndex(accessor);
      });

      pending.push(accessor);
    }

    assignExtrasToUserData(geometry, primitiveDef);

    this.computeBounds(geometry, primitiveDef);
    if (primitiveDef.targets !== undefined) {
      return this.addMorphTargets(geometry, primitiveDef.targets);
    } else {
      return geometry;
    }
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
   *
   * @param {BufferGeometry} geometry
   * @param {Array<GLTF.Target>} targets
   * @param {GLTFParser} parser
   * @return {Promise<BufferGeometry>}
   */
  async addMorphTargets(
    geometry: Three.BufferGeometry,
    targets: {
      [k: string]: number;
    }[]
  ) {
    let hasMorphPosition = false;
    let hasMorphNormal = false;

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (target.POSITION !== undefined) hasMorphPosition = true;
      if (target.NORMAL !== undefined) hasMorphNormal = true;

      if (hasMorphPosition && hasMorphNormal) break;
    }

    if (!hasMorphPosition && !hasMorphNormal) return geometry;

    const pendingPositionAccessors: Array<
      | Promise<Three.BufferAttribute | Three.InterleavedBufferAttribute>
      | Three.BufferAttribute
      | Three.InterleavedBufferAttribute
    > = [];
    const pendingNormalAccessors: Array<
      | Promise<Three.BufferAttribute | Three.InterleavedBufferAttribute>
      | Three.BufferAttribute
      | Three.InterleavedBufferAttribute
    > = [];

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (hasMorphPosition) {
        const pendingAccessor =
          target.POSITION !== undefined
            ? this.getDependency<
                Three.BufferAttribute | Three.InterleavedBufferAttribute
              >("accessor", target.POSITION)
            : geometry.attributes.position;

        pendingPositionAccessors.push(pendingAccessor);
      }

      if (hasMorphNormal) {
        const pendingAccessor =
          target.NORMAL !== undefined
            ? this.getDependency<
                Three.BufferAttribute | Three.InterleavedBufferAttribute
              >("accessor", target.NORMAL)
            : geometry.attributes.normal;

        pendingNormalAccessors.push(pendingAccessor);
      }
    }
    const accessors = await Promise.all([
      Promise.all(pendingPositionAccessors),
      Promise.all(pendingNormalAccessors),
    ]);
    const morphPositions = accessors[0];
    const morphNormals = accessors[1];

    if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
    if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;
    geometry.morphTargetsRelative = true;

    return geometry;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */
  loadGeometries(primitives: GSpec.MeshPrimitive[]) {
    const extensions = this.extensions;
    const cache = this.primitiveCache;

    const createDracoPrimitive = async (primitive: GSpec.MeshPrimitive) => {
      const geometry = await (
        extensions[
          EXTENSIONS.KHR_DRACO_MESH_COMPRESSION
        ] as GLTFDracoMeshCompressionExtension
      ).decodePrimitive(primitive);
      return this.addPrimitiveAttributes(geometry, primitive);
    };

    const pending: Promise<Three.BufferGeometry>[] = [];

    for (let i = 0, il = primitives.length; i < il; i++) {
      const primitive = primitives[i];
      const cacheKey = createPrimitiveKey(primitive);

      // See if we've already created this geometry
      const cached = cache[cacheKey];

      if (cached) {
        // Use the cached geometry if it exists
        pending.push(cached.promise);
      } else {
        let geometryPromise;

        if (
          primitive.extensions &&
          primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
        ) {
          // Use DRACO geometry if available
          geometryPromise = createDracoPrimitive(primitive);
        } else {
          // Otherwise create a new geometry
          geometryPromise = this.addPrimitiveAttributes(
            new Three.BufferGeometry(),
            primitive
          );
        }

        // Cache this geometry
        cache[cacheKey] = { primitive: primitive, promise: geometryPromise };

        pending.push(geometryPromise);
      }
    }

    return Promise.all(pending);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh>}
   */
  async loadMesh(meshIndex: number) {
    const extensions = this.extensions;

    const meshDef = this.gltf.meshes?.[meshIndex];
    const primitives = meshDef?.primitives;
    if (!!!meshDef || !!!primitives) {
      return;
    }
    const pending: Array<
      Promise<Three.Material | Array<Three.BufferGeometry>> | Three.Material
    > = [];

    primitives.forEach((e) => {
      if (e.material) {
        pending.push(
          this.getDependency<Three.Material>("material", e.material)
        );
      } else {
        pending.push(createDefaultMaterial());
      }
    });

    pending.push(this.loadGeometries(primitives));
    const results = await Promise.all(pending);
    const materials = results.slice(0, results.length - 1) as Three.Material[];
    const geometries = results[results.length - 1] as Three.BufferGeometry[];

    const meshes = [];

    for (let i = 0, il = geometries.length; i < il; i++) {
      const geometry = geometries[i];
      const primitive = primitives[i];

      // 1. create Mesh

      let mesh:
        | Three.Mesh
        | Three.LineSegments
        | Three.Line
        | Three.LineLoop
        | Three.Points;

      const material = materials[i];

      if (
        primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
        primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
        primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
        primitive.mode === undefined
      ) {
        // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
        mesh =
          meshDef.isSkinnedMesh === true
            ? new Three.SkinnedMesh(geometry, material)
            : new Three.Mesh(geometry, material);

        if (
          mesh instanceof Three.SkinnedMesh &&
          !mesh.geometry.attributes.skinWeight.normalized
        ) {
          // we normalize floating point skin weight array to fix malformed assets (see #15319)
          // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
          mesh.normalizeSkinWeights();
        }

        if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
          mesh.geometry = toTrianglesDrawMode(
            mesh.geometry,
            Three.TriangleStripDrawMode
          );
        } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
          mesh.geometry = toTrianglesDrawMode(
            mesh.geometry,
            Three.TriangleFanDrawMode
          );
        }
      } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
        mesh = new Three.LineSegments(geometry, material);
      } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
        mesh = new Three.Line(geometry, material);
      } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
        mesh = new Three.LineLoop(geometry, material);
      } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
        mesh = new Three.Points(geometry, material);
      } else {
        throw new Error(
          "THREE.GLTFLoader: Primitive mode unsupported: " + primitive.mode
        );
      }

      if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
        updateMorphTargets(mesh, meshDef);
      }

      mesh.name = createUniqueName(meshDef.name || "mesh_" + meshIndex);

      assignExtrasToUserData(mesh, meshDef);

      if (primitive.extensions)
        addUnknownExtensionsToUserData(extensions, mesh, primitive);

      this.assignFinalMaterial(mesh);

      meshes.push(mesh);
    }

    for (let i = 0, il = meshes.length; i < il; i++) {
      this.associations.set(meshes[i], {
        index: meshIndex,
        primitives: i,
      });
    }

    if (meshes.length === 1) {
      return meshes[0];
    }

    const group = new Three.Group();

    this.associations.set(group, { index: meshIndex });

    for (let i = 0, il = meshes.length; i < il; i++) {
      group.add(meshes[i]);
    }

    return group;
  }
  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accommodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh Mesh, Line, or Points instance.
   */
  assignFinalMaterial(
    mesh:
      | Three.Mesh
      | Three.LineSegments
      | Three.Line
      | Three.LineLoop
      | Three.Points
  ) {
    const geometry = mesh.geometry;
    let material = mesh.material as Three.Material;

    const useDerivativeTangents = geometry.attributes.tangent === undefined;
    const useVertexColors = geometry.attributes.color !== undefined;
    const useFlatShading = geometry.attributes.normal === undefined;

    if (mesh instanceof Three.Points) {
      const cacheKey =
        "PointsMaterial:" + (material as Three.PointsMaterial).uuid;

      let pointsMaterial = this.cache.get(cacheKey) as Three.PointsMaterial;

      if (!pointsMaterial) {
        pointsMaterial = new Three.PointsMaterial();
        Three.Material.prototype.copy.call(
          pointsMaterial,
          material as Three.PointsMaterial
        );
        pointsMaterial.color.copy((material as Three.PointsMaterial).color);
        pointsMaterial.map = (material as Three.PointsMaterial).map;
        pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

        this.cache.set(cacheKey, pointsMaterial);
      }

      material = pointsMaterial;
    } else if (mesh instanceof Three.Line) {
      const cacheKey = "LineBasicMaterial:" + (material as Three.Material).uuid;

      let lineMaterial = this.cache.get(cacheKey) as Three.LineBasicMaterial;

      if (!lineMaterial) {
        lineMaterial = new Three.LineBasicMaterial();
        Three.Material.prototype.copy.call(
          lineMaterial,
          material as Three.LineBasicMaterial
        );
        lineMaterial.color.copy((material as Three.LineBasicMaterial).color);

        this.cache.set(cacheKey, lineMaterial);
      }

      material = lineMaterial;
    }

    // Clone the material if it will be modified
    if (useDerivativeTangents || useVertexColors || useFlatShading) {
      let cacheKey = "ClonedMaterial:" + material.uuid + ":";

      if (material instanceof GLTFMeshStandardSGMaterial)
        cacheKey += "specular-glossiness:";
      if (useDerivativeTangents) cacheKey += "derivative-tangents:";
      if (useVertexColors) cacheKey += "vertex-colors:";
      if (useFlatShading) cacheKey += "flat-shading:";

      let cachedMaterial = this.cache.get(cacheKey) as Three.Material;

      if (!cachedMaterial) {
        cachedMaterial = material.clone();

        if (useVertexColors) cachedMaterial.vertexColors = true;
        if (useFlatShading)
          (cachedMaterial as Three.MeshStandardMaterial).flatShading = true;

        if (useDerivativeTangents) {
          // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
          if ((cachedMaterial as Three.MeshStandardMaterial).normalScale)
            (cachedMaterial as Three.MeshStandardMaterial).normalScale.y *= -1;
          if (
            (cachedMaterial as Three.MeshPhysicalMaterial).clearcoatNormalScale
          )
            (
              cachedMaterial as Three.MeshPhysicalMaterial
            ).clearcoatNormalScale.y *= -1;
        }

        this.cache.set(cacheKey, cachedMaterial);

        this.associations.set(cachedMaterial, this.associations.get(material));
      }

      material = cachedMaterial;
    }

    // workarounds for mesh and geometry

    if (
      (material as Three.MeshStandardMaterial).aoMap &&
      geometry.attributes.uv2 === undefined &&
      geometry.attributes.uv !== undefined
    ) {
      geometry.setAttribute("uv2", geometry.attributes.uv);
    }

    mesh.material = material;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   * @param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */
  async loadCamera(cameraIndex: number) {
    let camera: Three.Camera;
    const cameraDef = this.gltf.cameras?.[cameraIndex];
    if (!!!cameraDef) {
      return;
    }
    const params = cameraDef[cameraDef.type];

    if (!!!params) {
      logw("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }

    if (cameraDef.type === "perspective") {
      camera = new Three.PerspectiveCamera(
        Three.MathUtils.radToDeg(params.yfov),
        params.aspectRatio || 1,
        params.znear || 1,
        params.zfar || 2e6
      );
    } else if (cameraDef.type === "orthographic") {
      camera = new Three.OrthographicCamera(
        -params.xmag,
        params.xmag,
        params.ymag,
        -params.ymag,
        params.znear,
        params.zfar
      );
    } else {
      throw new Error(
        `THREE.GLTFLoader: Donot support camera type: ${cameraDef.type}`
      );
    }

    if (cameraDef.name) camera.name = createUniqueName(cameraDef.name);

    assignExtrasToUserData(camera, cameraDef);

    return Promise.resolve(camera);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Object>}
   */
  async loadSkin(skinIndex: number) {
    const skinDef = this.gltf.skins?.[skinIndex];
    if (!!!skinDef) {
      return;
    }
    const skinEntry: {
      joints: number[];
      inverseBindMatrices?:
        | Three.BufferAttribute
        | Three.InterleavedBufferAttribute;
    } = { joints: skinDef.joints };

    if (skinDef.inverseBindMatrices === undefined) {
      return skinEntry;
    }
    const accessor = await this.getDependency<
      Three.BufferAttribute | Three.InterleavedBufferAttribute
    >("accessor", skinDef.inverseBindMatrices);
    skinEntry.inverseBindMatrices = accessor;

    return skinEntry;
  }
  /**
   * Marks the special nodes/meshes in json for efficient parse.
   */
  _markDefs() {
    const nodeDefs = this.gltf.nodes || [];
    const skinDefs = this.gltf.skins || [];
    const meshDefs = this.gltf.meshes || [];

    // Nothing in the node definition indicates whether it is a Bone or an
    // Object3D. Use the skins' joint references to mark bones.
    for (
      let skinIndex = 0, skinLength = skinDefs.length;
      skinIndex < skinLength;
      skinIndex++
    ) {
      const joints = skinDefs[skinIndex].joints;

      for (let i = 0, il = joints.length; i < il; i++) {
        nodeDefs[joints[i]].isBone = true;
      }
    }

    // Iterate over all nodes, marking references to shared resources,
    // as well as skeleton joints.
    for (
      let nodeIndex = 0, nodeLength = nodeDefs.length;
      nodeIndex < nodeLength;
      nodeIndex++
    ) {
      const nodeDef = nodeDefs[nodeIndex];

      if (nodeDef.mesh !== undefined) {
        this._addNodeRef(this.meshCache, nodeDef.mesh);

        // Nothing in the mesh definition indicates whether it is
        // a SkinnedMesh or Mesh. Use the node's mesh reference
        // to mark SkinnedMesh if node has skin.
        if (nodeDef.skin !== undefined) {
          meshDefs[nodeDef.mesh].isSkinnedMesh = true;
        }
      }

      if (nodeDef.camera !== undefined) {
        this._addNodeRef(this.cameraCache, nodeDef.camera);
      }
    }
  }
  /**
   * Counts references to shared node / Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   */
  _addNodeRef(
    cache: { refs: Record<number, number>; uses: Record<number, number> },
    index: number
  ) {
    if (index === undefined) return;

    if (cache.refs[index] === undefined) {
      cache.refs[index] = cache.uses[index] = 0;
    }

    cache.refs[index]++;
  }

  /** Returns a reference to a shared resource, cloning it if necessary. */
  _getNodeRef<T extends Three.Object3D>(
    cache: { refs: Record<number, number>; uses: Record<number, number> },
    index: number,
    object: T
  ) {
    if (cache.refs[index] <= 1) return object;

    const ref = object.clone();

    // Propagates mappings to the cloned object, prevents mappings on the
    // original object from being lost.
    const updateMappings = (
      original: Three.Object3D,
      clone: Three.Object3D
    ) => {
      const mappings = this.associations.get(original);
      if (!!mappings) {
        this.associations.set(clone, mappings);
      }

      for (const [i, child] of original.children.entries()) {
        updateMappings(child, clone.children[i]);
      }
    };

    updateMappings(object, ref);

    ref.name += "_instance_" + cache.uses[index]++;

    return ref;
  }
  async createNodeMesh(nodeIndex: number) {
    const nodeDef = this.gltf.nodes?.[nodeIndex];

    if (nodeDef?.mesh === undefined) return;
    const mesh = await this.getDependency<Three.Mesh>("mesh", nodeDef.mesh);
    const node = this._getNodeRef(this.meshCache, nodeDef.mesh, mesh);

    // if weights are provided on the node, override weights on the mesh.
    if (nodeDef.weights !== undefined) {
      node.traverse((o) => {
        if (
          !(o instanceof Three.Mesh) ||
          !!!nodeDef.weights ||
          !!!o.morphTargetInfluences
        )
          return;
        for (let i = 0; i < nodeDef.weights.length; i++) {
          o.morphTargetInfluences[i] = nodeDef.weights[i];
        }
      });
    }
    return node;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  async loadNode(nodeIndex: number) {
    const extensions = this.extensions;

    const nodeDef = this.gltf.nodes?.[nodeIndex];
    if (!!!nodeDef) {
      return;
    }
    // reserve node's name before its dependencies, so the root has the intended name.
    const nodeName = nodeDef.name ? createUniqueName(nodeDef.name) : "";
    const pending = [];
    const meshPromise = this.createNodeMesh(nodeIndex);
    if (meshPromise) {
      pending.push(meshPromise);
    }
    const cameraIndex = nodeDef.camera;
    if (cameraIndex !== undefined) {
      pending.push(
        this.getDependency<Three.Camera>("camera", cameraIndex).then(
          (camera) => {
            return this._getNodeRef(this.cameraCache, cameraIndex, camera);
          }
        )
      );
    }
    Object.values(this.extensions).forEach((extension) => {
      if (extension instanceof AttachmentExtension) {
        pending.push(extension.createNodeAttachment(nodeIndex));
      }
    });
    const objects = await Promise.all(pending);

    let node: Three.Object3D;

    // .isBone isn't in glTF spec. See ._markDefs
    if (nodeDef.isBone === true) {
      node = new Three.Bone();
    } else if (objects.length > 1) {
      node = new Three.Group();
    } else if (objects.length === 1) {
      node = objects[0] as Three.Object3D;
    } else {
      node = new Three.Object3D();
    }

    if (node !== objects[0]) {
      for (let i = 0, il = objects.length; i < il; i++) {
        node.add(objects[i] as Three.Object3D);
      }
    }

    if (nodeDef.name) {
      node.userData.name = nodeDef.name;
      node.name = nodeName;
    }

    assignExtrasToUserData(node, nodeDef);

    if (nodeDef.extensions)
      addUnknownExtensionsToUserData(extensions, node, nodeDef);

    if (nodeDef.matrix !== undefined) {
      const matrix = new Three.Matrix4();
      matrix.fromArray(nodeDef.matrix);
      node.applyMatrix4(matrix);
    } else {
      if (nodeDef.translation !== undefined) {
        node.position.fromArray(nodeDef.translation);
      }

      if (nodeDef.rotation !== undefined) {
        node.quaternion.fromArray(nodeDef.rotation);
      }

      if (nodeDef.scale !== undefined) {
        node.scale.fromArray(nodeDef.scale);
      }
    }
    const association = this.associations.get(node);
    if (!!!association) {
      this.associations.set(node, { index: nodeIndex });
    } else {
      association.index = nodeIndex;
    }
    return node;
  }

  async getDependency<T>(type: GLTFDepsType, index: number) {
    const cacheKey = type + ":" + index;
    let dependency = this.cache.get(cacheKey);
    if (!!!dependency) {
      switch (type) {
        case "material":
          dependency = await this.loadMaterial(index);
          break;
        case "texture":
          dependency = await this.loadTexture(index);
          break;
        case "buffer":
          dependency = await this.loadBuffer(index);
          break;
        case "bufferView":
          dependency = await this.loadBufferView(index);
          break;
        case "accessor":
          dependency = await this.loadAccessor(index);
          break;
        case "mesh":
          dependency = await this.loadMesh(index);
          break;
        case "camera":
          dependency = await this.loadCamera(index);
          break;
        case "skin":
          dependency = await this.loadSkin(index);
      }

      if (!!dependency) {
        this.cache.set(cacheKey, dependency);
      }
    }
    return dependency as unknown as T;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  async loadMaterial(materialIndex: number) {
    const extensions = this.extensions;
    const materialDef = this.gltf.materials?.[materialIndex];
    if (!!!materialDef) {
      return;
    }
    let materialType: (new (...args: any) => Three.Material) | undefined;
    const materialParams: Record<string, any> = {};
    const materialExtensions = materialDef.extensions || {};

    const pending: Array<Promise<any> | undefined> = [];

    if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
      const sgExtension = extensions[
        EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS
      ] as GLTFMaterialsPbrSpecularGlossinessExtension;
      materialType = sgExtension.getMaterialType();
      pending.push(sgExtension.extendParams(materialParams, materialDef));
    } else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      const kmuExtension = extensions[
        EXTENSIONS.KHR_MATERIALS_UNLIT
      ] as GLTFMaterialsUnlitExtension;
      materialType = kmuExtension.getMaterialType();
      pending.push(kmuExtension.extendParams(materialParams, materialDef));
    } else {
      // Specification:
      // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

      const metallicRoughness: GSpec.MaterialPbrMetallicRoughness =
        materialDef.pbrMetallicRoughness || {};
      materialParams.color = new Three.Color(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(
          this.assignTexture(
            materialParams,
            "map",
            metallicRoughness.baseColorTexture
          )
        );
      }

      materialParams.metalness =
        metallicRoughness.metallicFactor !== undefined
          ? metallicRoughness.metallicFactor
          : 1.0;
      materialParams.roughness =
        metallicRoughness.roughnessFactor !== undefined
          ? metallicRoughness.roughnessFactor
          : 1.0;

      if (metallicRoughness.metallicRoughnessTexture !== undefined) {
        pending.push(
          this.assignTexture(
            materialParams,
            "metalnessMap",
            metallicRoughness.metallicRoughnessTexture
          )
        );
        pending.push(
          this.assignTexture(
            materialParams,
            "roughnessMap",
            metallicRoughness.metallicRoughnessTexture
          )
        );
      }
      const extensions = Object.values(this.extensions).filter(
        (e) => e instanceof MeshExtension
      ) as MeshExtension[];
      for (const extension of extensions) {
        materialType = extension.getMaterialType(materialIndex);
        if (materialType) {
          break;
        }
      }
      if (!!!materialType) {
        materialType = Three.MeshStandardMaterial;
      }

      pending.push(
        Promise.all(
          extensions.map((e) => {
            return (
              e.extendMaterialParams &&
              e.extendMaterialParams(materialIndex, materialParams)
            );
          })
        )
      );
    }

    if (materialDef.doubleSided === true) {
      materialParams.side = Three.DoubleSide;
    }

    const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;

      // See: https://github.com/mrdoob/three.js/issues/17706
      materialParams.depthWrite = false;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest =
          materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }

    if (
      materialDef.normalTexture !== undefined &&
      materialType !== Three.MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "normalMap",
          materialDef.normalTexture
        )
      );

      materialParams.normalScale = new Three.Vector2(1, 1);

      if (materialDef.normalTexture.scale !== undefined) {
        const scale = materialDef.normalTexture.scale;

        materialParams.normalScale.set(scale, scale);
      }
    }

    if (
      materialDef.occlusionTexture !== undefined &&
      materialType !== Three.MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "aoMap",
          materialDef.occlusionTexture
        )
      );

      if (materialDef.occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }

    if (
      materialDef.emissiveFactor !== undefined &&
      materialType !== Three.MeshBasicMaterial
    ) {
      materialParams.emissive = new Three.Color().fromArray(
        materialDef.emissiveFactor
      );
    }

    if (
      materialDef.emissiveTexture !== undefined &&
      materialType !== Three.MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "emissiveMap",
          materialDef.emissiveTexture
        )
      );
    }

    return Promise.all(pending).then(() => {
      let material: Three.Material;
      if (!!!materialType) {
        return;
      }
      if (materialType === GLTFMeshStandardSGMaterial) {
        material = (
          extensions[
            EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS
          ] as GLTFMaterialsPbrSpecularGlossinessExtension
        ).createMaterial(materialParams);
      } else {
        material = new materialType(materialParams);
      }

      if (materialDef.name) material.name = materialDef.name;

      // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
      if ((material as any).map)
        (material as any).map.encoding = Three.sRGBEncoding;
      if ((material as any).emissiveMap)
        (material as any).emissiveMap.encoding = Three.sRGBEncoding;

      assignExtrasToUserData(material, materialDef);

      this.associations.set(material, { index: materialIndex });

      if (materialDef.extensions)
        addUnknownExtensionsToUserData(extensions, material, materialDef);

      return material;
    });
  }

  /**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @return {Promise<Texture>}
   */
  async assignTexture(
    materialParams: Record<string, any>,
    mapName: string,
    mapDef: GSpec.MaterialNormalTextureInfo
  ) {
    let texture = await this.getDependency<Three.Texture>(
      "texture",
      mapDef.index
    );
    // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
    // However, we will copy UV set 0 to UV set 1 on demand for aoMap
    if (!!!texture) {
      return;
    }
    if (
      mapDef.texCoord !== undefined &&
      mapDef.texCoord != 0 &&
      !(mapName === "aoMap" && mapDef.texCoord == 1)
    ) {
      logw(
        "THREE.GLTFLoader: Custom UV set " +
          mapDef.texCoord +
          " for texture " +
          mapName +
          " not yet supported."
      );
    }

    if (this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
      const transform =
        mapDef.extensions !== undefined
          ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]
          : undefined;

      if (transform) {
        const gltfReference = this.associations.get(texture);
        texture = (
          this.extensions[
            EXTENSIONS.KHR_TEXTURE_TRANSFORM
          ] as GLTFTextureTransformExtension
        ).extendTexture(texture, transform);
        if (!!gltfReference) {
          this.associations.set(texture, gltfReference);
        }
      }
    }

    materialParams[mapName] = texture;

    return texture;
  }

  async loadTexture(textureIndex: number) {
    const textureDef = this.gltf.textures?.[textureIndex];
    if (!!!textureDef?.source) {
      return;
    }
    const source = this.gltf.images?.[textureDef.source];
    if (!!!source) {
      return;
    }
    const texture = await this.loadTextureImage(textureIndex, source);
    return texture;
  }

  async loadTextureImage(textureIndex: number, source: GSpec.Image) {
    const textureDef = this.gltf.textures?.[textureIndex];
    if (!!!textureDef) {
      return;
    }

    const cacheKey =
      (source.uri || source.bufferView) + ":" + textureDef.sampler;

    if (!!this.textureCache[cacheKey]) {
      // See https://github.com/mrdoob/three.js/issues/21559.
      return this.textureCache[cacheKey];
    }

    if (source.uri === undefined) {
      throw new Error(
        "THREE.GLTFLoader: Image " +
          textureIndex +
          " is missing URI and bufferView"
      );
    }
    const url = Three.LoaderUtils.resolveURL(
      source.uri || "",
      this.option.path
    );
    const resource = new UnifiedResource(this.option.resType, url);
    const texture = await loadTexture(this.context, resource);
    texture.flipY = false;

    if (textureDef.name) texture.name = textureDef.name;

    const samplers: GSpec.Sampler[] = this.gltf.samplers || [];
    const sampler: GSpec.Sampler = samplers[textureDef.sampler!!] || {};

    texture.magFilter =
      WEBGL_FILTERS[sampler.magFilter!!] || Three.LinearFilter;
    texture.minFilter =
      WEBGL_FILTERS[sampler.minFilter!!] || Three.LinearMipmapLinearFilter;
    texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS!!] || Three.RepeatWrapping;
    texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT!!] || Three.RepeatWrapping;

    this.associations.set(texture, { index: textureIndex });

    this.textureCache[cacheKey] = texture;

    return texture;
  }
}

async function loadTexture(context: BridgeContext, resource: Resource) {
  const imageInfo = await imageDecoder(context).getImageInfo(resource);
  const imagePixels = await imageDecoder(context).decodeToPixels(resource);
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
