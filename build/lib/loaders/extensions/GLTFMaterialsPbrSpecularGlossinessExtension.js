var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 */
/**
 * A sub class of StandardMaterial with some of the functionality
 * changed via the `onBeforeCompile` callback
 * @pailhead
 */
export class GLTFMeshStandardSGMaterial extends Three.MeshStandardMaterial {
    constructor(params) {
        super();
        this.isGLTFSpecularGlossinessMaterial = true;
        this.glossiness = 0;
        //various chunks that need replacing
        const specularMapParsFragmentChunk = [
            "#ifdef USE_SPECULARMAP",
            "	uniform sampler2D specularMap;",
            "#endif",
        ].join("\n");
        const glossinessMapParsFragmentChunk = [
            "#ifdef USE_GLOSSINESSMAP",
            "	uniform sampler2D glossinessMap;",
            "#endif",
        ].join("\n");
        const specularMapFragmentChunk = [
            "vec3 specularFactor = specular;",
            "#ifdef USE_SPECULARMAP",
            "	vec4 texelSpecular = texture2D( specularMap, vUv );",
            "	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture",
            "	specularFactor *= texelSpecular.rgb;",
            "#endif",
        ].join("\n");
        const glossinessMapFragmentChunk = [
            "float glossinessFactor = glossiness;",
            "#ifdef USE_GLOSSINESSMAP",
            "	vec4 texelGlossiness = texture2D( glossinessMap, vUv );",
            "	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture",
            "	glossinessFactor *= texelGlossiness.a;",
            "#endif",
        ].join("\n");
        const lightPhysicalFragmentChunk = [
            "PhysicalMaterial material;",
            "material.diffuseColor = diffuseColor.rgb * ( 1. - max( specularFactor.r, max( specularFactor.g, specularFactor.b ) ) );",
            "vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );",
            "float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );",
            "material.roughness = max( 1.0 - glossinessFactor, 0.0525 ); // 0.0525 corresponds to the base mip of a 256 cubemap.",
            "material.roughness += geometryRoughness;",
            "material.roughness = min( material.roughness, 1.0 );",
            "material.specularColor = specularFactor;",
        ].join("\n");
        const uniforms = {
            specular: { value: new Three.Color().setHex(0xffffff) },
            glossiness: { value: 1 },
            specularMap: { value: null },
            glossinessMap: { value: null },
        };
        this.onBeforeCompile = (shader) => {
            Object.entries(uniforms).forEach((entity) => {
                shader.uniforms[entity[0]] = entity[1];
            });
            shader.fragmentShader = shader.fragmentShader
                .replace("uniform float roughness;", "uniform vec3 specular;")
                .replace("uniform float metalness;", "uniform float glossiness;")
                .replace("#include <roughnessmap_pars_fragment>", specularMapParsFragmentChunk)
                .replace("#include <metalnessmap_pars_fragment>", glossinessMapParsFragmentChunk)
                .replace("#include <roughnessmap_fragment>", specularMapFragmentChunk)
                .replace("#include <metalnessmap_fragment>", glossinessMapFragmentChunk)
                .replace("#include <lights_physical_fragment>", lightPhysicalFragmentChunk);
        };
        Object.defineProperties(this, {
            specular: {
                get: function () {
                    return uniforms.specular.value;
                },
                set: function (v) {
                    uniforms.specular.value = v;
                },
            },
            specularMap: {
                get: function () {
                    return uniforms.specularMap.value;
                },
                set: function (v) {
                    uniforms.specularMap.value = v;
                    if (v) {
                        this.defines.USE_SPECULARMAP = ""; // USE_UV is set by the renderer for specular maps
                    }
                    else {
                        delete this.defines.USE_SPECULARMAP;
                    }
                },
            },
            glossiness: {
                get: function () {
                    return uniforms.glossiness.value;
                },
                set: function (v) {
                    uniforms.glossiness.value = v;
                },
            },
            glossinessMap: {
                get: function () {
                    return uniforms.glossinessMap.value;
                },
                set: function (v) {
                    uniforms.glossinessMap.value = v;
                    if (v) {
                        this.defines.USE_GLOSSINESSMAP = "";
                        this.defines.USE_UV = "";
                    }
                    else {
                        delete this.defines.USE_GLOSSINESSMAP;
                        delete this.defines.USE_UV;
                    }
                },
            },
        });
        delete this.metalness;
        delete this.roughness;
        delete this.metalnessMap;
        delete this.roughnessMap;
        this.setValues(params);
    }
    copy(source) {
        var _a;
        super.copy(source);
        this.specularMap = source.specularMap;
        if (source.specular) {
            (_a = this.specular) === null || _a === void 0 ? void 0 : _a.copy(source.specular);
        }
        this.glossinessMap = source.glossinessMap;
        this.glossiness = source.glossiness;
        delete this.metalness;
        delete this.roughness;
        delete this.metalnessMap;
        delete this.roughnessMap;
        return this;
    }
}
export class GLTFMaterialsPbrSpecularGlossinessExtension extends MeshExtension {
    constructor() {
        super(...arguments);
        this.name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
        this.specularGlossinessParams = [
            "color",
            "map",
            "lightMap",
            "lightMapIntensity",
            "aoMap",
            "aoMapIntensity",
            "emissive",
            "emissiveIntensity",
            "emissiveMap",
            "bumpMap",
            "bumpScale",
            "normalMap",
            "normalMapType",
            "displacementMap",
            "displacementScale",
            "displacementBias",
            "specularMap",
            "specular",
            "glossinessMap",
            "glossiness",
            "alphaMap",
            "envMap",
            "envMapIntensity",
            "refractionRatio",
        ];
        this.extendParams = (params, materialDef) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const pbrSpecularGlossiness = (_a = materialDef.extensions) === null || _a === void 0 ? void 0 : _a[this.name];
            if (!!!pbrSpecularGlossiness) {
                return;
            }
            const materialParams = params;
            materialParams.color = new Three.Color(1.0, 1.0, 1.0);
            materialParams.opacity = 1.0;
            const pending = [];
            if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
                const array = pbrSpecularGlossiness.diffuseFactor;
                materialParams.color.fromArray(array);
                materialParams.opacity = array[3];
            }
            if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
                pending.push(this.context.assignTexture(materialParams, "map", pbrSpecularGlossiness.diffuseTexture));
            }
            materialParams.emissive = new Three.Color(0.0, 0.0, 0.0);
            materialParams.glossiness =
                pbrSpecularGlossiness.glossinessFactor !== undefined
                    ? pbrSpecularGlossiness.glossinessFactor
                    : 1.0;
            materialParams.specular = new Three.Color(1.0, 1.0, 1.0);
            if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
                materialParams.specular.fromArray(pbrSpecularGlossiness.specularFactor);
            }
            if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
                const specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
                pending.push(this.context.assignTexture(materialParams, "glossinessMap", specGlossMapDef));
                pending.push(this.context.assignTexture(materialParams, "specularMap", specGlossMapDef));
            }
            return Promise.all(pending);
        });
        this.createMaterial = (params) => {
            const materialParams = params;
            const material = new GLTFMeshStandardSGMaterial(materialParams);
            material.fog = true;
            material.color = materialParams.color;
            material.map = materialParams.map === undefined ? null : materialParams.map;
            material.lightMap = null;
            material.lightMapIntensity = 1.0;
            material.aoMap =
                materialParams.aoMap === undefined ? null : materialParams.aoMap;
            material.aoMapIntensity = 1.0;
            material.emissive = materialParams.emissive;
            material.emissiveIntensity = 1.0;
            material.emissiveMap =
                materialParams.emissiveMap === undefined
                    ? null
                    : materialParams.emissiveMap;
            material.bumpMap =
                materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
            material.bumpScale = 1;
            material.normalMap =
                materialParams.normalMap === undefined ? null : materialParams.normalMap;
            material.normalMapType = Three.TangentSpaceNormalMap;
            if (materialParams.normalScale)
                material.normalScale = materialParams.normalScale;
            material.displacementMap = null;
            material.displacementScale = 1;
            material.displacementBias = 0;
            material.specularMap =
                materialParams.specularMap === undefined
                    ? null
                    : materialParams.specularMap;
            material.specular = materialParams.specular;
            material.glossinessMap =
                materialParams.glossinessMap === undefined
                    ? null
                    : materialParams.glossinessMap;
            material.glossiness = materialParams.glossiness;
            material.alphaMap = null;
            material.envMap =
                materialParams.envMap === undefined ? null : materialParams.envMap;
            material.envMapIntensity = 1.0;
            material.refractionRatio = 0.98;
            return material;
        };
    }
    getMaterialType() {
        return GLTFMeshStandardSGMaterial;
    }
}
//# sourceMappingURL=GLTFMaterialsPbrSpecularGlossinessExtension.js.map