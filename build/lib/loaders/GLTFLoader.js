var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { imageDecoder, loge, logw, resourceLoader, } from "doric";
import * as Three from "three";
import { ArrayBufferResource, UnifiedResource } from "../utils";
import { createUniqueName } from "./GLTFUtils";
import { GLTFDracoMeshCompressionExtension } from "./extensions/GLTFDracoMeshCompressionExtension";
import { AttachmentExtension, ATTRIBUTES, BufferViewExtension, EXTENSIONS, MeshExtension, TextureExtension, WEBGL_COMPONENT_TYPES, WEBGL_FILTERS, WEBGL_WRAPPINGS, } from "./extensions/GLTFExtensions";
import { GLTFLightsExtension } from "./extensions/GLTFLightsExtension";
import { GLTFMaterialsClearcoatExtension } from "./extensions/GLTFMaterialsClearcoatExtension";
import { GLTFMaterialsIorExtension } from "./extensions/GLTFMaterialsIorExtension";
import { GLTFMaterialsPbrSpecularGlossinessExtension, GLTFMeshStandardSGMaterial, } from "./extensions/GLTFMaterialsPbrSpecularGlossinessExtension";
import { GLTFMaterialsSheenExtension } from "./extensions/GLTFMaterialsSheenExtension";
import { GLTFMaterialsSpecularExtension } from "./extensions/GLTFMaterialsSpecularExtension";
import { GLTFMaterialsTransmissionExtension } from "./extensions/GLTFMaterialsTransmissionExtension";
import { GLTFMaterialsUnlitExtension } from "./extensions/GLTFMaterialsUnlitExtension";
import { GLTFMaterialsVolumeExtension } from "./extensions/GLTFMaterialsVolumeExtension";
import { GLTFMeshoptCompressionExtension } from "./extensions/GLTFMeshoptCompressionExtension";
import { GLTFTextureBasisUExtension } from "./extensions/GLTFTextureBasisUExtension";
import { GLTFTextureTransformExtension } from "./extensions/GLTFTextureTransformExtension";
import { GLTFTextureWebPExtension } from "./extensions/GLTFTextureWebPExtension";
import { GLTFCubicSplineInterpolant, GLTFCubicSplineQuaternionInterpolant, } from "./Interpolation";
import { GLTFMeshQuantizationExtension } from "./extensions/GLTFMeshQuantizationExtension";
import { KTX2Loader } from "./KTX2Loader";
import { GLTFMaterialsVariantsExtension } from "./extensions/GLTFMaterialsVariantsExtension";
export function loadGLTF(context, resource, asyncTexture = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const loader = new GLTFLoader(context);
        return loader.load(resource, asyncTexture);
    });
}
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
    CUBICSPLINE: undefined,
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
function updateMorphTargets(mesh, meshDef) {
    mesh.updateMorphTargets();
    if (meshDef.weights !== undefined && !!mesh.morphTargetInfluences) {
        for (let i = 0, il = meshDef.weights.length; i < il; i++) {
            mesh.morphTargetInfluences[i] = meshDef.weights[i];
        }
    }
    // .extras has user-defined data, so check that .extras.targetNames is an array.
    if (meshDef.extras &&
        Array.isArray(meshDef.extras.targetNames) &&
        !!mesh.morphTargetInfluences) {
        const targetNames = meshDef.extras.targetNames;
        if (mesh.morphTargetInfluences.length === targetNames.length) {
            mesh.morphTargetDictionary = {};
            for (let i = 0, il = targetNames.length; i < il; i++) {
                mesh.morphTargetDictionary[targetNames[i]] = i;
            }
        }
        else {
            logw("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
        }
    }
}
/**
 * @param {BufferGeometry} geometry
 * @param {Number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode(geometry, drawMode) {
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
            loge("THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.");
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
    }
    else {
        // gl.TRIANGLE_STRIP
        for (let i = 0; i < numberOfTriangles; i++) {
            if (i % 2 === 0) {
                newIndices.push(index.getX(i));
                newIndices.push(index.getX(i + 1));
                newIndices.push(index.getX(i + 2));
            }
            else {
                newIndices.push(index.getX(i + 2));
                newIndices.push(index.getX(i + 1));
                newIndices.push(index.getX(i));
            }
        }
    }
    if (newIndices.length / 3 !== numberOfTriangles) {
        loge("THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    }
    // build final geometry
    const newGeometry = geometry.clone();
    newGeometry.setIndex(newIndices);
    return newGeometry;
}
function createAttributesKey(attributes) {
    let attributesKey = "";
    const keys = Object.keys(attributes).sort();
    for (let i = 0, il = keys.length; i < il; i++) {
        attributesKey += keys[i] + ":" + attributes[keys[i]] + ";";
    }
    return attributesKey;
}
function createPrimitiveKey(primitiveDef) {
    const dracoExtension = primitiveDef.extensions &&
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
    }
    else {
        geometryKey =
            primitiveDef.indices +
                ":" +
                createAttributesKey(primitiveDef.attributes) +
                ":" +
                primitiveDef.mode;
    }
    return geometryKey;
}
function parseGLB(data) {
    const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
    const header = {
        magic: Three.LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
        version: headerView.getUint32(4, true),
        length: headerView.getUint32(8, true),
    };
    if (header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
        throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    }
    else if (header.version < 2.0) {
        throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    }
    const chunkContentsLength = header.length - BINARY_EXTENSION_HEADER_LENGTH;
    const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
    let chunkIndex = 0;
    let content = undefined;
    let body = undefined;
    while (chunkIndex < chunkContentsLength) {
        const chunkLength = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        const chunkType = chunkView.getUint32(chunkIndex, true);
        chunkIndex += 4;
        if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
            const contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
            content = Three.LoaderUtils.decodeText(contentArray);
        }
        else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
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
function assignExtrasToUserData(object, hasExtras) {
    if (hasExtras.extras !== undefined) {
        if (typeof hasExtras.extras === "object") {
            Object.assign(object.userData, hasExtras.extras);
        }
        else {
            logw("THREE.GLTFLoader: Ignoring primitive type .extras, " + hasExtras.extras);
        }
    }
}
function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
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
let defaultMaterial = undefined;
/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial() {
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
    constructor(context, renderer) {
        super();
        this.extensionTypes = [
            GLTFMaterialsClearcoatExtension,
            GLTFTextureBasisUExtension,
            GLTFTextureWebPExtension,
            GLTFMaterialsSheenExtension,
            GLTFMaterialsTransmissionExtension,
            GLTFMaterialsVolumeExtension,
            GLTFMaterialsIorExtension,
            GLTFMaterialsSpecularExtension,
            GLTFLightsExtension,
            GLTFMeshoptCompressionExtension, //
        ];
        this.context = context;
        this.renderer = renderer;
    }
    loadTexture(pendingTexture) {
        return __awaiter(this, void 0, void 0, function* () {
            const { texture, resource } = pendingTexture;
            const imageInfo = yield imageDecoder(this.context).getImageInfo(resource);
            const imagePixels = yield imageDecoder(this.context).decodeToPixels(resource);
            texture.image = {
                data: new Uint8ClampedArray(imagePixels),
                width: imageInfo.width,
                height: imageInfo.height,
            };
            texture.needsUpdate = true;
            return texture;
        });
    }
    load(resource, asyncTexture = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = resource.identifier;
            const data = yield resourceLoader(this.context).load(resource);
            const magic = Three.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
            let gltf;
            let glbBody = undefined;
            if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
                const { content, body } = parseGLB(data);
                glbBody = body;
                if (!!!content) {
                    throw new Error("THREE.GLTFLoader: Content is empty.");
                }
                gltf = JSON.parse(content);
            }
            else {
                const content = Three.LoaderUtils.decodeText(new Uint8Array(data));
                gltf = JSON.parse(content);
            }
            if (gltf.asset === undefined || parseInt(gltf.asset.version) < 2) {
                throw new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.");
            }
            const gltfParser = new GLTFParser({
                bridgeContext: this.context,
                path: Three.LoaderUtils.extractUrlBase(url),
                gltf,
                resType: resource.type,
                body: glbBody,
                asyncTexture,
            });
            if (this.renderer) {
                gltfParser.ktx2Loader = new KTX2Loader(this.renderer);
            }
            this.extensionTypes.forEach((e) => {
                const extension = new e(gltfParser);
                gltfParser.extensions[extension.name] = extension;
            });
            if (gltf.extensionsUsed) {
                for (let i = 0; i < gltf.extensionsUsed.length; ++i) {
                    const extensionName = gltf.extensionsUsed[i];
                    const extensionsRequired = gltf.extensionsRequired || [];
                    switch (extensionName) {
                        case EXTENSIONS.KHR_MATERIALS_UNLIT:
                            gltfParser.extensions[extensionName] =
                                new GLTFMaterialsUnlitExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
                            gltfParser.extensions[extensionName] =
                                new GLTFMaterialsPbrSpecularGlossinessExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
                            gltfParser.extensions[extensionName] =
                                new GLTFDracoMeshCompressionExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
                            gltfParser.extensions[extensionName] =
                                new GLTFTextureTransformExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_MESH_QUANTIZATION:
                            gltfParser.extensions[extensionName] =
                                new GLTFMeshQuantizationExtension(gltfParser);
                            break;
                        case EXTENSIONS.KHR_MATERIALS_VARIANTS:
                            gltfParser.extensions[extensionName] =
                                new GLTFMaterialsVariantsExtension(gltfParser);
                            break;
                        default:
                            logw('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
                            break;
                    }
                }
            }
            return gltfParser.parse();
        });
    }
}
function getNormalizedComponentScale(constructor) {
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
            throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
    }
}
class GLTFParser {
    constructor(option) {
        this.textureCache = {};
        this.associations = new Map();
        this.cache = new Map();
        this.meshCache = { refs: {}, uses: {} };
        this.cameraCache = { refs: {}, uses: {} };
        this.extensions = {};
        this.primitiveCache = {};
        this.pendingTextures = [];
        this.option = option;
    }
    get bridgeContext() {
        return this.option.bridgeContext;
    }
    addCache(n, v) {
        this.cache.set(n, v);
    }
    getCache(n) {
        return this.cache.get(n);
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = Object.values(this.extensions);
            // Clear the loader cache
            this.cache.clear();
            // Mark the special nodes/meshes in json for efficient parse
            this._markDefs();
            extensions.forEach((ext) => {
                ext.markRefs && ext.markRefs();
            });
            extensions.forEach((ext) => {
                ext.beforeRoot && ext.beforeRoot();
            });
            const dependencies = yield Promise.all([
                this.getDependencies("scene"),
                this.getDependencies("animation"),
                this.getDependencies("camera"),
            ]);
            const result = {
                scene: dependencies[0][this.gltf.scene || 0],
                scenes: dependencies[0],
                animations: dependencies[1],
                cameras: dependencies[2],
                asset: this.gltf.asset,
                userData: {},
                pendingTextures: this.pendingTextures,
            };
            addUnknownExtensionsToUserData(extensions, result, this.gltf);
            assignExtrasToUserData(result, this.gltf);
            extensions.forEach((ext) => {
                ext.afterRoot && ext.afterRoot();
            });
            if (this.extensions[EXTENSIONS.KHR_MATERIALS_VARIANTS]) {
                const extension = this.extensions[EXTENSIONS.KHR_MATERIALS_VARIANTS];
                return Object.assign(Object.assign({}, result), { variants: extension.variants, variantChanger: (idx) => __awaiter(this, void 0, void 0, function* () {
                        yield extension.changeVariant(idx);
                    }) });
            }
            else {
                return result;
            }
        });
    }
    /**
     * Requests all dependencies of the specified type asynchronously, with caching.
     * @param {string} type
     * @return {Promise<Array<Object>>}
     */
    getDependencies(type) {
        return __awaiter(this, void 0, void 0, function* () {
            let dependencies = this.getCache(type);
            if (!dependencies) {
                const defs = this.gltf[type + (type === "mesh" ? "es" : "s")] || [];
                dependencies = Promise.all(defs.map((_, index) => {
                    return this.getDependency(type, index);
                }));
                this.addCache(type, dependencies);
            }
            return dependencies;
        });
    }
    get gltf() {
        return this.option.gltf;
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
     * @param {number} accessorIndex
     * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
     */
    loadAccessor(accessorIndex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const accessorDef = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[accessorIndex];
            if (!!!accessorDef) {
                return;
            }
            if (accessorDef.bufferView === undefined &&
                accessorDef.sparse === undefined) {
                // Ignore empty accessors, which may be used to declare runtime
                // information about attributes coming from another source (e.g. Draco
                // compression extension).
                return;
            }
            const pendingBufferViews = [];
            if (accessorDef.bufferView !== undefined) {
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.bufferView));
            }
            if (accessorDef.sparse !== undefined) {
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.indices.bufferView));
                pendingBufferViews.push(this.getDependency("bufferView", accessorDef.sparse.values.bufferView));
            }
            const bufferViews = yield Promise.all(pendingBufferViews);
            const bufferView = bufferViews[0];
            const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
            const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
            // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
            const elementBytes = TypedArray.BYTES_PER_ELEMENT;
            const itemBytes = elementBytes * itemSize;
            const byteOffset = accessorDef.byteOffset || 0;
            const byteStride = accessorDef.bufferView !== undefined
                ? (_b = this.gltf.bufferViews) === null || _b === void 0 ? void 0 : _b[accessorDef.bufferView].byteStride
                : undefined;
            const normalized = accessorDef.normalized === true;
            let array, bufferAttribute;
            // The buffer is not interleaved if the stride is the item size in bytes.
            if (byteStride && byteStride !== itemBytes) {
                // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
                // This makes sure that IBA.count reflects accessor.count properly
                const ibSlice = Math.floor(byteOffset / byteStride);
                const ibCacheKey = "InterleavedBuffer:" +
                    accessorDef.bufferView +
                    ":" +
                    accessorDef.componentType +
                    ":" +
                    ibSlice +
                    ":" +
                    accessorDef.count;
                let ibPromise = this.getCache(ibCacheKey);
                let ib = !!ibPromise ? yield ibPromise : undefined;
                if (!!!ib) {
                    array = new TypedArray(bufferView, ibSlice * byteStride, (accessorDef.count * byteStride) / elementBytes);
                    // Integer parameters to IB/IBA are in array elements, not bytes.
                    ib = new Three.InterleavedBuffer(array, byteStride / elementBytes);
                    this.addCache(ibCacheKey, ib);
                }
                bufferAttribute = new Three.InterleavedBufferAttribute(ib, itemSize, (byteOffset % byteStride) / elementBytes, normalized);
            }
            else {
                if (bufferView === null) {
                    array = new TypedArray(accessorDef.count * itemSize);
                }
                else {
                    array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
                }
                bufferAttribute = new Three.BufferAttribute(array, itemSize, normalized);
            }
            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
            if (accessorDef.sparse !== undefined) {
                const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
                const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];
                const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
                const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
                const sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
                const sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);
                if (!!bufferView) {
                    // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                    bufferAttribute = new Three.BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
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
                        throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
                }
            }
            return bufferAttribute;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferViewIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBufferView(bufferViewIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bufferViewDef = (_a = this.gltf.bufferViews) === null || _a === void 0 ? void 0 : _a[bufferViewIndex];
            if (!!!bufferViewDef) {
                return;
            }
            let buffer = yield this.getDependency("buffer", bufferViewDef.buffer);
            if (!!!buffer) {
                for (const extension of Object.values(this.extensions)) {
                    if (extension instanceof BufferViewExtension) {
                        buffer = yield extension.loadBufferView(bufferViewIndex);
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
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     * @param {number} bufferIndex
     * @return {Promise<ArrayBuffer>}
     */
    loadBuffer(bufferIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bufferDef = (_a = this.gltf.buffers) === null || _a === void 0 ? void 0 : _a[bufferIndex];
            if (!!!bufferDef) {
                return undefined;
            }
            if (bufferDef.type && bufferDef.type !== "arraybuffer") {
                throw new Error("THREE.GLTFLoader: " + bufferDef.type + " buffer type is not supported.");
            }
            // If present, GLB container is required to be the first buffer.
            if (bufferDef.uri === undefined && bufferIndex === 0) {
                return this.option.body;
            }
            const resource = yield Promise.resolve(new UnifiedResource(this.option.resType, Three.LoaderUtils.resolveURL(bufferDef.uri || "", this.option.path)));
            const data = yield resourceLoader(this.option.bridgeContext).load(resource);
            return data;
        });
    }
    /**
     * @param {BufferGeometry} geometry
     * @param {GLTF.Primitive} primitiveDef
     * @param {GLTFParser} parser
     */
    computeBounds(geometry, primitiveDef) {
        var _a, _b;
        const attributes = primitiveDef.attributes;
        const box = new Three.Box3();
        if (attributes.POSITION !== undefined) {
            const accessor = (_a = this.gltf.accessors) === null || _a === void 0 ? void 0 : _a[attributes.POSITION];
            if (!!!accessor) {
                return;
            }
            const min = accessor.min;
            const max = accessor.max;
            // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.
            if (min !== undefined && max !== undefined) {
                box.set(new Three.Vector3(min[0], min[1], min[2]), new Three.Vector3(max[0], max[1], max[2]));
                if (accessor.normalized) {
                    const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                    box.min.multiplyScalar(boxScale);
                    box.max.multiplyScalar(boxScale);
                }
            }
            else {
                logw("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
                return;
            }
        }
        else {
            return;
        }
        const targets = primitiveDef.targets;
        if (targets !== undefined) {
            const maxDisplacement = new Three.Vector3();
            const vector = new Three.Vector3();
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (target.POSITION !== undefined) {
                    const accessor = (_b = this.gltf.accessors) === null || _b === void 0 ? void 0 : _b[target.POSITION];
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
                            const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                            vector.multiplyScalar(boxScale);
                        }
                        // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
                        // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
                        // are used to implement key-frame animations and as such only two are active at a time - this results in very large
                        // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
                        maxDisplacement.max(vector);
                    }
                    else {
                        logw("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
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
    addPrimitiveAttributes(geometry, primitiveDef) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributes = primitiveDef.attributes;
            const pending = [];
            const assignAttributeAccessor = (accessorIndex, attributeName) => __awaiter(this, void 0, void 0, function* () {
                const accessor = yield this.getDependency("accessor", accessorIndex);
                geometry.setAttribute(attributeName, accessor);
            });
            for (const gltfAttributeName in attributes) {
                const threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();
                // Skip attributes already provided by e.g. Draco extension.
                if (threeAttributeName in geometry.attributes)
                    continue;
                pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
            }
            if (primitiveDef.indices !== undefined && !geometry.index) {
                const accessor = this.getDependency("accessor", primitiveDef.indices).then((accessor) => {
                    geometry.setIndex(accessor);
                });
                pending.push(accessor);
            }
            assignExtrasToUserData(geometry, primitiveDef);
            this.computeBounds(geometry, primitiveDef);
            yield Promise.all(pending);
            if (primitiveDef.targets !== undefined) {
                return this.addMorphTargets(geometry, primitiveDef.targets);
            }
            else {
                return geometry;
            }
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
     *
     * @param {BufferGeometry} geometry
     * @param {Array<GLTF.Target>} targets
     * @param {GLTFParser} parser
     * @return {Promise<BufferGeometry>}
     */
    addMorphTargets(geometry, targets) {
        return __awaiter(this, void 0, void 0, function* () {
            let hasMorphPosition = false;
            let hasMorphNormal = false;
            let hasMorphColor = false;
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (target.POSITION !== undefined)
                    hasMorphPosition = true;
                if (target.NORMAL !== undefined)
                    hasMorphNormal = true;
                if (target.COLOR_0 !== undefined)
                    hasMorphColor = true;
                if (hasMorphPosition && hasMorphNormal && hasMorphColor)
                    break;
            }
            if (!hasMorphPosition && !hasMorphNormal && !hasMorphColor)
                return geometry;
            const pendingPositionAccessors = [];
            const pendingNormalAccessors = [];
            const pendingColorAccessors = [];
            for (let i = 0, il = targets.length; i < il; i++) {
                const target = targets[i];
                if (hasMorphPosition) {
                    const pendingAccessor = target.POSITION !== undefined
                        ? this.getDependency("accessor", target.POSITION)
                        : geometry.attributes.position;
                    pendingPositionAccessors.push(pendingAccessor);
                }
                if (hasMorphNormal) {
                    const pendingAccessor = target.NORMAL !== undefined
                        ? this.getDependency("accessor", target.NORMAL)
                        : geometry.attributes.normal;
                    pendingNormalAccessors.push(pendingAccessor);
                }
                if (hasMorphColor) {
                    const pendingAccessor = target.COLOR_0 !== undefined
                        ? this.getDependency("accessor", target.COLOR_0)
                        : geometry.attributes.color;
                    pendingColorAccessors.push(pendingAccessor);
                }
            }
            const accessors = yield Promise.all([
                Promise.all(pendingPositionAccessors),
                Promise.all(pendingNormalAccessors),
                Promise.all(pendingColorAccessors),
            ]);
            const morphPositions = accessors[0];
            const morphNormals = accessors[1];
            const morphColors = accessors[2];
            if (hasMorphPosition)
                geometry.morphAttributes.position = morphPositions;
            if (hasMorphNormal)
                geometry.morphAttributes.normal = morphNormals;
            if (hasMorphColor)
                geometry.morphAttributes.color = morphColors;
            geometry.morphTargetsRelative = true;
            return geometry;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
     *
     * Creates BufferGeometries from primitives.
     *
     * @param {Array<GLTF.Primitive>} primitives
     * @return {Promise<Array<BufferGeometry>>}
     */
    loadGeometries(primitives) {
        const extensions = this.extensions;
        const cache = this.primitiveCache;
        const createDracoPrimitive = (primitive) => __awaiter(this, void 0, void 0, function* () {
            const geometry = yield extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(primitive);
            return this.addPrimitiveAttributes(geometry, primitive);
        });
        const pending = [];
        for (let i = 0, il = primitives.length; i < il; i++) {
            const primitive = primitives[i];
            const cacheKey = createPrimitiveKey(primitive);
            // See if we've already created this geometry
            const cached = cache[cacheKey];
            if (cached) {
                // Use the cached geometry if it exists
                pending.push(cached.promise);
            }
            else {
                let geometryPromise;
                if (primitive.extensions &&
                    primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
                    // Use DRACO geometry if available
                    geometryPromise = createDracoPrimitive(primitive);
                }
                else {
                    // Otherwise create a new geometry
                    geometryPromise = this.addPrimitiveAttributes(new Three.BufferGeometry(), primitive);
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
    loadMesh(meshIndex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const meshDef = (_a = this.gltf.meshes) === null || _a === void 0 ? void 0 : _a[meshIndex];
            const primitives = meshDef === null || meshDef === void 0 ? void 0 : meshDef.primitives;
            if (!!!meshDef || !!!primitives) {
                return;
            }
            const pending = [];
            pending.push(this.loadGeometries(primitives));
            const geometries = yield this.loadGeometries(primitives);
            const meshes = [];
            for (let i = 0; i < primitives.length; i++) {
                const geometry = geometries[i];
                const primitive = primitives[i];
                // 1. create Mesh
                let mesh;
                let material;
                if (primitive.material !== undefined) {
                    material = yield this.getDependency("material", primitive.material);
                }
                else {
                    material = createDefaultMaterial();
                }
                if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
                    primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
                    primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
                    primitive.mode === undefined) {
                    // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
                    mesh =
                        meshDef.isSkinnedMesh === true
                            ? new Three.SkinnedMesh(geometry, material)
                            : new Three.Mesh(geometry, material);
                    if (mesh.isSkinnedMesh &&
                        !mesh.geometry.attributes.skinWeight.normalized) {
                        // we normalize floating point skin weight array to fix malformed assets (see #15319)
                        // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
                        mesh.normalizeSkinWeights();
                    }
                    if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
                        mesh.geometry = toTrianglesDrawMode(mesh.geometry, Three.TriangleStripDrawMode);
                    }
                    else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
                        mesh.geometry = toTrianglesDrawMode(mesh.geometry, Three.TriangleFanDrawMode);
                    }
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
                    mesh = new Three.LineSegments(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
                    mesh = new Three.Line(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
                    mesh = new Three.LineLoop(geometry, material);
                }
                else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
                    mesh = new Three.Points(geometry, material);
                }
                else {
                    throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + primitive.mode);
                }
                if ((_b = primitive.extensions) === null || _b === void 0 ? void 0 : _b[EXTENSIONS.KHR_MATERIALS_VARIANTS]) {
                    const extension = this.extensions[EXTENSIONS.KHR_MATERIALS_VARIANTS];
                    const variantMapping = primitive.extensions[EXTENSIONS.KHR_MATERIALS_VARIANTS];
                    extension.variantCallback.push((variantIndex) => __awaiter(this, void 0, void 0, function* () {
                        var _c;
                        const materialIdx = (_c = variantMapping.mappings.find((e) => e.variants.filter((v) => v === variantIndex).length > 0)) === null || _c === void 0 ? void 0 : _c.material;
                        if (materialIdx === undefined) {
                            loge(`${extension.name} error: change variant ${variantIndex} at mesh${meshIndex},primitive${i}`);
                        }
                        else {
                            const newMaterial = yield this.getDependency("material", materialIdx);
                            mesh.material = newMaterial;
                        }
                    }));
                }
                if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
                    updateMorphTargets(mesh, meshDef);
                }
                mesh.name = createUniqueName(meshDef.name || "mesh_" + meshIndex);
                assignExtrasToUserData(mesh, meshDef);
                if (primitive.extensions)
                    addUnknownExtensionsToUserData(extensions, mesh, primitive);
                yield this.assignFinalMaterial(mesh);
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
        });
    }
    /**
     * Assigns final material to a Mesh, Line, or Points instance. The instance
     * already has a material (generated from the glTF material options alone)
     * but reuse of the same glTF material may require multiple threejs materials
     * to accommodate different primitive types, defines, etc. New materials will
     * be created if necessary, and reused from a cache.
     * @param  {Object3D} mesh Mesh, Line, or Points instance.
     */
    assignFinalMaterial(mesh) {
        return __awaiter(this, void 0, void 0, function* () {
            const geometry = mesh.geometry;
            let material = mesh.material;
            const useDerivativeTangents = geometry.attributes.tangent === undefined;
            const useVertexColors = geometry.attributes.color !== undefined;
            const useFlatShading = geometry.attributes.normal === undefined;
            if (mesh instanceof Three.Points) {
                const cacheKey = "PointsMaterial:" + material.uuid;
                let pointsMaterialPromise = this.getCache(cacheKey);
                let pointsMaterial = !!pointsMaterialPromise
                    ? yield pointsMaterialPromise
                    : undefined;
                if (!pointsMaterial) {
                    pointsMaterial = new Three.PointsMaterial();
                    Three.Material.prototype.copy.call(pointsMaterial, material);
                    pointsMaterial.color.copy(material.color);
                    pointsMaterial.map = material.map;
                    pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px
                    this.addCache(cacheKey, pointsMaterial);
                }
                material = pointsMaterial;
            }
            else if (mesh instanceof Three.Line) {
                const cacheKey = "LineBasicMaterial:" + material.uuid;
                let lineMaterialPromise = this.getCache(cacheKey);
                let lineMaterial = !!lineMaterialPromise
                    ? yield lineMaterialPromise
                    : undefined;
                if (!lineMaterial) {
                    lineMaterial = new Three.LineBasicMaterial();
                    Three.Material.prototype.copy.call(lineMaterial, material);
                    lineMaterial.color.copy(material.color);
                    this.addCache(cacheKey, lineMaterial);
                }
                material = lineMaterial;
            }
            // Clone the material if it will be modified
            if (useDerivativeTangents || useVertexColors || useFlatShading) {
                let cacheKey = "ClonedMaterial:" + material.uuid + ":";
                if (material instanceof GLTFMeshStandardSGMaterial)
                    cacheKey += "specular-glossiness:";
                if (useDerivativeTangents)
                    cacheKey += "derivative-tangents:";
                if (useVertexColors)
                    cacheKey += "vertex-colors:";
                if (useFlatShading)
                    cacheKey += "flat-shading:";
                let cachedMaterialPromise = this.getCache(cacheKey);
                let cachedMaterial = !!cachedMaterialPromise
                    ? yield cachedMaterialPromise
                    : undefined;
                if (!!!cachedMaterial) {
                    cachedMaterial = material.clone();
                    if (useVertexColors)
                        cachedMaterial.vertexColors = true;
                    if (useFlatShading)
                        cachedMaterial.flatShading = true;
                    if (useDerivativeTangents) {
                        // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
                        if (cachedMaterial.normalScale)
                            cachedMaterial.normalScale.y *= -1;
                        if (cachedMaterial.clearcoatNormalScale)
                            cachedMaterial.clearcoatNormalScale.y *= -1;
                    }
                    this.addCache(cacheKey, cachedMaterial);
                    this.associations.set(cachedMaterial, this.associations.get(material));
                }
                material = cachedMaterial;
            }
            // workarounds for mesh and geometry
            if (material.aoMap &&
                geometry.attributes.uv2 === undefined &&
                geometry.attributes.uv !== undefined) {
                geometry.setAttribute("uv2", geometry.attributes.uv);
            }
            mesh.material = material;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
     * @param {number} cameraIndex
     * @return {Promise<THREE.Camera>}
     */
    loadCamera(cameraIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let camera;
            const cameraDef = (_a = this.gltf.cameras) === null || _a === void 0 ? void 0 : _a[cameraIndex];
            if (!!!cameraDef) {
                return;
            }
            const params = cameraDef[cameraDef.type];
            if (!!!params) {
                logw("THREE.GLTFLoader: Missing camera parameters.");
                return;
            }
            if (cameraDef.type === "perspective") {
                camera = new Three.PerspectiveCamera(Three.MathUtils.radToDeg(params.yfov), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
            }
            else if (cameraDef.type === "orthographic") {
                camera = new Three.OrthographicCamera(-params.xmag, params.xmag, params.ymag, -params.ymag, params.znear, params.zfar);
            }
            else {
                throw new Error(`THREE.GLTFLoader: Donot support camera type: ${cameraDef.type}`);
            }
            if (cameraDef.name)
                camera.name = createUniqueName(cameraDef.name);
            assignExtrasToUserData(camera, cameraDef);
            return Promise.resolve(camera);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
     * @param {number} skinIndex
     * @return {Promise<Object>}
     */
    loadSkin(skinIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const skinDef = (_a = this.gltf.skins) === null || _a === void 0 ? void 0 : _a[skinIndex];
            if (!!!skinDef) {
                return;
            }
            const skinEntry = { joints: skinDef.joints };
            if (skinDef.inverseBindMatrices === undefined) {
                return skinEntry;
            }
            const accessor = yield this.getDependency("accessor", skinDef.inverseBindMatrices);
            skinEntry.inverseBindMatrices = accessor;
            return skinEntry;
        });
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
        for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
            const joints = skinDefs[skinIndex].joints;
            for (let i = 0, il = joints.length; i < il; i++) {
                nodeDefs[joints[i]].isBone = true;
            }
        }
        // Iterate over all nodes, marking references to shared resources,
        // as well as skeleton joints.
        for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
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
    _addNodeRef(cache, index) {
        if (index === undefined)
            return;
        if (cache.refs[index] === undefined) {
            cache.refs[index] = cache.uses[index] = 0;
        }
        cache.refs[index]++;
    }
    /** Returns a reference to a shared resource, cloning it if necessary. */
    _getNodeRef(cache, index, object) {
        if (cache.refs[index] <= 1)
            return object;
        const ref = object.clone();
        // Propagates mappings to the cloned object, prevents mappings on the
        // original object from being lost.
        const updateMappings = (original, clone) => {
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
    createNodeMesh(nodeIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeIndex];
            if ((nodeDef === null || nodeDef === void 0 ? void 0 : nodeDef.mesh) === undefined)
                return;
            const mesh = yield this.getDependency("mesh", nodeDef.mesh);
            const node = this._getNodeRef(this.meshCache, nodeDef.mesh, mesh);
            // if weights are provided on the node, override weights on the mesh.
            if (nodeDef.weights !== undefined) {
                node.traverse((o) => {
                    if (!(o instanceof Three.Mesh) ||
                        !!!nodeDef.weights ||
                        !!!o.morphTargetInfluences)
                        return;
                    for (let i = 0; i < nodeDef.weights.length; i++) {
                        o.morphTargetInfluences[i] = nodeDef.weights[i];
                    }
                });
            }
            return node;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
     * @param {number} animationIndex
     * @return {Promise<AnimationClip>}
     */
    loadAnimation(animationIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const animationDef = (_a = this.gltf.animations) === null || _a === void 0 ? void 0 : _a[animationIndex];
            if (!!!animationDef) {
                return;
            }
            const pendingNodes = [];
            const pendingInputAccessors = [];
            const pendingOutputAccessors = [];
            const pendingSamplers = [];
            const pendingTargets = [];
            for (let i = 0, il = animationDef.channels.length; i < il; i++) {
                const channel = animationDef.channels[i];
                const sampler = animationDef.samplers[channel.sampler];
                const target = channel.target;
                const name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.
                const input = animationDef.parameters !== undefined
                    ? animationDef.parameters[sampler.input]
                    : sampler.input;
                const output = animationDef.parameters !== undefined
                    ? animationDef.parameters[sampler.output]
                    : sampler.output;
                pendingNodes.push(this.getDependency("node", name));
                pendingInputAccessors.push(this.getDependency("accessor", input));
                pendingOutputAccessors.push(this.getDependency("accessor", output));
                pendingSamplers.push(sampler);
                pendingTargets.push(target);
            }
            const dependencies = yield Promise.all([
                Promise.all(pendingNodes),
                Promise.all(pendingInputAccessors),
                Promise.all(pendingOutputAccessors),
                Promise.all(pendingSamplers),
                Promise.all(pendingTargets),
            ]);
            const nodes = dependencies[0];
            const inputAccessors = dependencies[1];
            const outputAccessors = dependencies[2];
            const samplers = dependencies[3];
            const targets = dependencies[4];
            const tracks = [];
            for (let i = 0, il = nodes.length; i < il; i++) {
                const node = nodes[i];
                const inputAccessor = inputAccessors[i];
                const outputAccessor = outputAccessors[i];
                const sampler = samplers[i];
                const target = targets[i];
                if (node === undefined)
                    continue;
                node.updateMatrix();
                node.matrixAutoUpdate = true;
                let TypedKeyframeTrack;
                switch (PATH_PROPERTIES[target.path]) {
                    case PATH_PROPERTIES.weights:
                        TypedKeyframeTrack = Three.NumberKeyframeTrack;
                        break;
                    case PATH_PROPERTIES.rotation:
                        TypedKeyframeTrack = Three.QuaternionKeyframeTrack;
                        break;
                    case PATH_PROPERTIES.position:
                    case PATH_PROPERTIES.scale:
                    default:
                        TypedKeyframeTrack = Three.VectorKeyframeTrack;
                        break;
                }
                const targetName = node.name ? node.name : node.uuid;
                const interpolation = sampler.interpolation !== undefined
                    ? INTERPOLATION[sampler.interpolation]
                    : Three.InterpolateLinear;
                const targetNames = [];
                if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
                    node.traverse((object) => {
                        if (object.morphTargetInfluences) {
                            targetNames.push(object.name ? object.name : object.uuid);
                        }
                    });
                }
                else {
                    targetNames.push(targetName);
                }
                let outputArray = outputAccessor.array;
                if (outputAccessor.normalized) {
                    const scale = getNormalizedComponentScale(outputArray.constructor);
                    const scaled = new Float32Array(outputArray.length);
                    for (let j = 0, jl = outputArray.length; j < jl; j++) {
                        scaled[j] = outputArray[j] * scale;
                    }
                    outputArray = scaled;
                }
                for (let j = 0, jl = targetNames.length; j < jl; j++) {
                    const track = new TypedKeyframeTrack(targetNames[j] + "." + PATH_PROPERTIES[target.path], inputAccessor.array, outputArray, interpolation);
                    // Override interpolation with custom factory method.
                    if (sampler.interpolation === "CUBICSPLINE") {
                        track.createInterpolant =
                            function InterpolantFactoryMethodGLTFCubicSpline(result) {
                                // A CUBICSPLINE keyframe in glTF has three output values for each input value,
                                // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
                                // must be divided by three to get the interpolant's sampleSize argument.
                                const interpolantType = this instanceof Three.QuaternionKeyframeTrack
                                    ? GLTFCubicSplineQuaternionInterpolant
                                    : GLTFCubicSplineInterpolant;
                                return new interpolantType(this.times, this.values, this.getValueSize() / 3, result);
                            };
                        // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
                        track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
                    }
                    tracks.push(track);
                }
            }
            const name = animationDef.name
                ? animationDef.name
                : "animation_" + animationIndex;
            return new Three.AnimationClip(name, undefined, tracks);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
     * @param {number} nodeIndex
     * @return {Promise<Object3D>}
     */
    loadNode(nodeIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeIndex];
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
                pending.push(this.getDependency("camera", cameraIndex).then((camera) => {
                    return this._getNodeRef(this.cameraCache, cameraIndex, camera);
                }));
            }
            Object.values(this.extensions).forEach((extension) => {
                if (extension instanceof AttachmentExtension) {
                    pending.push(extension.createNodeAttachment(nodeIndex));
                }
            });
            const objects = (yield Promise.all(pending)).filter((e) => !!e);
            let node;
            // .isBone isn't in glTF spec. See ._markDefs
            if (nodeDef.isBone === true) {
                node = new Three.Bone();
            }
            else if (objects.length > 1) {
                node = new Three.Group();
            }
            else if (objects.length === 1) {
                node = objects[0];
            }
            else {
                node = new Three.Object3D();
            }
            if (node !== objects[0]) {
                for (let i = 0, il = objects.length; i < il; i++) {
                    node.add(objects[i]);
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
            }
            else {
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
            }
            else {
                association.index = nodeIndex;
            }
            return node;
        });
    }
    buildNodeHierarchy(nodeId, parentObject) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const nodeDef = (_a = this.gltf.nodes) === null || _a === void 0 ? void 0 : _a[nodeId];
            if (!!!nodeDef) {
                throw new Error("buildNodeHierarchy error");
            }
            const node = yield this.getDependency("node", nodeId);
            if (nodeDef.skin !== undefined) {
                // build skeleton here as well
                const skinEntry = yield this.getDependency("skin", nodeDef.skin);
                const pendingJoints = [];
                for (let i = 0, il = skinEntry.joints.length; i < il; i++) {
                    pendingJoints.push(this.getDependency("node", skinEntry.joints[i]));
                }
                const jointNodes = yield Promise.all(pendingJoints);
                node.traverse((mesh) => {
                    if (!mesh.isMesh)
                        return;
                    const bones = [];
                    const boneInverses = [];
                    for (let j = 0, jl = jointNodes.length; j < jl; j++) {
                        const jointNode = jointNodes[j];
                        if (jointNode) {
                            bones.push(jointNode);
                            const mat = new Three.Matrix4();
                            if (skinEntry.inverseBindMatrices !== undefined) {
                                mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
                            }
                            boneInverses.push(mat);
                        }
                        else {
                            logw('THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[j]);
                        }
                    }
                    mesh.bind(new Three.Skeleton(bones, boneInverses), mesh.matrixWorld);
                });
            }
            parentObject.add(node);
            const pending = [];
            if (nodeDef.children) {
                const children = nodeDef.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    pending.push(this.buildNodeHierarchy(child, node));
                }
            }
            return Promise.all(pending);
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
     * @param {number} sceneIndex
     * @return {Promise<Group>}
     */
    loadScene(sceneIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const sceneDef = (_a = this.gltf.scenes) === null || _a === void 0 ? void 0 : _a[sceneIndex];
            if (!!!sceneDef) {
                loge("THREE.GLTFLoader:loadScene", sceneIndex, "null");
                return;
            }
            // Loader returns Group, not Scene.
            // See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
            const scene = new Three.Group();
            if (sceneDef.name)
                scene.name = createUniqueName(sceneDef.name);
            assignExtrasToUserData(scene, sceneDef);
            if (sceneDef.extensions)
                addUnknownExtensionsToUserData(extensions, scene, sceneDef);
            const nodeIds = sceneDef.nodes || [];
            const pending = [];
            for (let i = 0; i < nodeIds.length; i++) {
                pending.push(this.buildNodeHierarchy(nodeIds[i], scene));
            }
            yield Promise.all(pending);
            // Removes dangling associations, associations that reference a node that
            // didn't make it into the scene.
            const reduceAssociations = (node) => {
                const reducedAssociations = new Map();
                for (const [key, value] of this.associations) {
                    if (key instanceof Three.Material || key instanceof Three.Texture) {
                        reducedAssociations.set(key, value);
                    }
                }
                node.traverse((node) => {
                    const mappings = this.associations.get(node);
                    if (!!mappings) {
                        reducedAssociations.set(node, mappings);
                    }
                });
                return reducedAssociations;
            };
            this.associations = reduceAssociations(scene);
            return scene;
        });
    }
    getDependency(type, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = type + ":" + index;
            let dependency = this.getCache(cacheKey);
            if (!!!dependency) {
                switch (type) {
                    case "material":
                        dependency = this.loadMaterial(index);
                        break;
                    case "texture":
                        dependency = this.loadTexture(index);
                        break;
                    case "buffer":
                        dependency = this.loadBuffer(index);
                        break;
                    case "bufferView":
                        dependency = this.loadBufferView(index);
                        if (!!!dependency) {
                            for (const extension of Object.values(this.extensions)) {
                                if (extension instanceof BufferViewExtension) {
                                    dependency = extension.loadBufferView(index);
                                    if (!!!dependency) {
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    case "accessor":
                        dependency = this.loadAccessor(index);
                        break;
                    case "mesh":
                        dependency = this.loadMesh(index);
                        break;
                    case "camera":
                        dependency = this.loadCamera(index);
                        break;
                    case "skin":
                        dependency = this.loadSkin(index);
                        break;
                    case "node":
                        dependency = this.loadNode(index);
                        break;
                    case "animation":
                        dependency = this.loadAnimation(index);
                        break;
                    case "scene":
                        dependency = this.loadScene(index);
                        break;
                }
                if (!!dependency) {
                    this.addCache(cacheKey, dependency);
                }
            }
            const ret = (yield dependency);
            if (!!!ret) {
                loge(`THREE.GLTFLoader.GetDependency: Unable to get ${type} at index ${index}`);
            }
            return ret;
        });
    }
    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
     * @param {number} materialIndex
     * @return {Promise<Material>}
     */
    loadMaterial(materialIndex) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = this.extensions;
            const materialDef = (_a = this.gltf.materials) === null || _a === void 0 ? void 0 : _a[materialIndex];
            if (!!!materialDef) {
                return;
            }
            let materialType;
            const materialParams = {};
            const materialExtensions = materialDef.extensions || {};
            const pending = [];
            if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
                const sgExtension = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
                materialType = sgExtension.getMaterialType();
                pending.push(sgExtension.extendParams(materialParams, materialDef));
            }
            else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
                const kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
                materialType = kmuExtension.getMaterialType();
                pending.push(kmuExtension.extendParams(materialParams, materialDef));
            }
            else {
                // Specification:
                // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
                const metallicRoughness = materialDef.pbrMetallicRoughness || {};
                materialParams.color = new Three.Color(1.0, 1.0, 1.0);
                materialParams.opacity = 1.0;
                if (Array.isArray(metallicRoughness.baseColorFactor)) {
                    const array = metallicRoughness.baseColorFactor;
                    materialParams.color.fromArray(array);
                    materialParams.opacity = array[3];
                }
                if (metallicRoughness.baseColorTexture !== undefined) {
                    pending.push(this.assignTexture(materialParams, "map", metallicRoughness.baseColorTexture));
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
                    pending.push(this.assignTexture(materialParams, "metalnessMap", metallicRoughness.metallicRoughnessTexture));
                    pending.push(this.assignTexture(materialParams, "roughnessMap", metallicRoughness.metallicRoughnessTexture));
                }
                const extensions = Object.values(this.extensions).filter((e) => e instanceof MeshExtension);
                for (const extension of extensions) {
                    materialType = extension.getMaterialType(materialIndex);
                    if (materialType) {
                        break;
                    }
                }
                if (!!!materialType) {
                    materialType = Three.MeshStandardMaterial;
                }
                pending.push(Promise.all(extensions.map((e) => {
                    return (e.extendMaterialParams &&
                        e.extendMaterialParams(materialIndex, materialParams));
                })));
            }
            if (materialDef.doubleSided === true) {
                materialParams.side = Three.DoubleSide;
            }
            const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;
            if (alphaMode === ALPHA_MODES.BLEND) {
                materialParams.transparent = true;
                // See: https://github.com/mrdoob/three.js/issues/17706
                materialParams.depthWrite = false;
            }
            else {
                materialParams.transparent = false;
                if (alphaMode === ALPHA_MODES.MASK) {
                    materialParams.alphaTest =
                        materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
                }
            }
            if (materialDef.normalTexture !== undefined &&
                materialType !== Three.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "normalMap", materialDef.normalTexture));
                materialParams.normalScale = new Three.Vector2(1, 1);
                if (materialDef.normalTexture.scale !== undefined) {
                    const scale = materialDef.normalTexture.scale;
                    materialParams.normalScale.set(scale, scale);
                }
            }
            if (materialDef.occlusionTexture !== undefined &&
                materialType !== Three.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "aoMap", materialDef.occlusionTexture));
                if (materialDef.occlusionTexture.strength !== undefined) {
                    materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
                }
            }
            if (materialDef.emissiveFactor !== undefined &&
                materialType !== Three.MeshBasicMaterial) {
                materialParams.emissive = new Three.Color().fromArray(materialDef.emissiveFactor);
            }
            if (materialDef.emissiveTexture !== undefined &&
                materialType !== Three.MeshBasicMaterial) {
                pending.push(this.assignTexture(materialParams, "emissiveMap", materialDef.emissiveTexture));
            }
            return Promise.all(pending).then(() => {
                let material;
                if (!!!materialType) {
                    return;
                }
                if (materialType === GLTFMeshStandardSGMaterial) {
                    material = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].createMaterial(materialParams);
                }
                else {
                    material = new materialType(materialParams);
                }
                if (materialDef.name)
                    material.name = materialDef.name;
                // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
                if (material.map)
                    material.map.encoding = Three.sRGBEncoding;
                if (material.emissiveMap)
                    material.emissiveMap.encoding = Three.sRGBEncoding;
                assignExtrasToUserData(material, materialDef);
                this.associations.set(material, { index: materialIndex });
                if (materialDef.extensions)
                    addUnknownExtensionsToUserData(extensions, material, materialDef);
                return material;
            });
        });
    }
    /**
     * Asynchronously assigns a texture to the given material parameters.
     * @param {Object} materialParams
     * @param {string} mapName
     * @param {Object} mapDef
     * @return {Promise<Texture>}
     */
    assignTexture(materialParams, mapName, mapDef) {
        return __awaiter(this, void 0, void 0, function* () {
            let texture = yield this.getDependency("texture", mapDef.index);
            // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
            // However, we will copy UV set 0 to UV set 1 on demand for aoMap
            if (!!!texture) {
                loge("THREE.GLTFLoader:assignTexture", mapDef.index, "null");
                return;
            }
            if (mapDef.texCoord !== undefined &&
                mapDef.texCoord != 0 &&
                !(mapName === "aoMap" && mapDef.texCoord == 1)) {
                logw("THREE.GLTFLoader: Custom UV set " +
                    mapDef.texCoord +
                    " for texture " +
                    mapName +
                    " not yet supported.");
            }
            if (this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
                const transform = mapDef.extensions !== undefined
                    ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]
                    : undefined;
                if (transform) {
                    const gltfReference = this.associations.get(texture);
                    texture = this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(texture, transform);
                    if (!!gltfReference) {
                        this.associations.set(texture, gltfReference);
                    }
                }
            }
            materialParams[mapName] = texture;
            return texture;
        });
    }
    loadTexture(textureIndex) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if ((textureDef === null || textureDef === void 0 ? void 0 : textureDef.source) === undefined) {
                let dependency;
                for (const extension of Object.values(this.extensions)) {
                    if (extension instanceof TextureExtension) {
                        dependency = extension.loadTexture(textureIndex);
                        if (!!dependency) {
                            break;
                        }
                    }
                }
                return dependency;
            }
            const source = (_b = this.gltf.images) === null || _b === void 0 ? void 0 : _b[textureDef.source];
            if (!!!source) {
                return;
            }
            return this.loadTextureImage(textureIndex, source);
        });
    }
    loadTextureImage(textureIndex, source) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const textureDef = (_a = this.gltf.textures) === null || _a === void 0 ? void 0 : _a[textureIndex];
            if (!!!textureDef) {
                return;
            }
            const cacheKey = (source.uri || source.bufferView) + ":" + textureDef.sampler;
            if (!!this.textureCache[cacheKey]) {
                // See https://github.com/mrdoob/three.js/issues/21559.
                return this.textureCache[cacheKey];
            }
            let resource;
            if (source.bufferView !== undefined) {
                const arrayBuffer = yield this.getDependency("bufferView", source.bufferView);
                if (!!!arrayBuffer) {
                    loge(`THREE.GLTFLoader: Image ${textureIndex} is missing bufferView ${source.bufferView}`);
                    return;
                }
                resource = new ArrayBufferResource(arrayBuffer);
            }
            else if (source.uri !== undefined) {
                const url = Three.LoaderUtils.resolveURL(decodeURIComponent(source.uri) || "", this.option.path);
                resource = new UnifiedResource(this.option.resType, url);
            }
            else {
                loge(`THREE.GLTFLoader: Image ${textureIndex} is missing URI and bufferView,source is ${JSON.stringify(source)}`);
                return;
            }
            const texture = yield loadTexture(this, resource);
            texture.flipY = false;
            if (textureDef.name)
                texture.name = textureDef.name;
            const samplers = this.gltf.samplers || [];
            const sampler = samplers[textureDef.sampler] || {};
            texture.magFilter =
                WEBGL_FILTERS[sampler.magFilter] || Three.LinearFilter;
            texture.minFilter =
                WEBGL_FILTERS[sampler.minFilter] || Three.LinearMipmapLinearFilter;
            texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || Three.RepeatWrapping;
            texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || Three.RepeatWrapping;
            this.associations.set(texture, { index: textureIndex });
            this.textureCache[cacheKey] = texture;
            return texture;
        });
    }
}
function loadTexture(parser, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        const texture = new Three.DataTexture();
        texture.format = Three.RGBAFormat;
        if (parser.option.asyncTexture) {
            parser.pendingTextures.push({
                texture,
                resource,
            });
            return texture;
        }
        else {
            const imageInfo = yield imageDecoder(parser.option.bridgeContext).getImageInfo(resource);
            const imagePixels = yield imageDecoder(parser.option.bridgeContext).decodeToPixels(resource);
            texture.image = {
                data: new Uint8ClampedArray(imagePixels),
                width: imageInfo.width,
                height: imageInfo.height,
            };
            texture.needsUpdate = true;
            return texture;
        }
    });
}
//# sourceMappingURL=GLTFLoader.js.map