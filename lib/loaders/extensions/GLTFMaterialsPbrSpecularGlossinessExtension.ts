import { EXTENSIONS, MeshExtension } from "./GLTFExtensions";
import * as Three from "three";
import * as GSpec from "../glTF";

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
  isGLTFSpecularGlossinessMaterial = true;
  constructor(params: Three.MeshStandardMaterialParameters) {
    super();

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
        .replace(
          "#include <roughnessmap_pars_fragment>",
          specularMapParsFragmentChunk
        )
        .replace(
          "#include <metalnessmap_pars_fragment>",
          glossinessMapParsFragmentChunk
        )
        .replace("#include <roughnessmap_fragment>", specularMapFragmentChunk)
        .replace("#include <metalnessmap_fragment>", glossinessMapFragmentChunk)
        .replace(
          "#include <lights_physical_fragment>",
          lightPhysicalFragmentChunk
        );
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
          } else {
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
          } else {
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

  specularMap: any;
  specular?: Three.Color;
  glossinessMap: any;
  glossiness = 0;
  metalness: any;
  roughness: any;
  metalnessMap: any;
  roughnessMap: any;

  copy(source: GLTFMeshStandardSGMaterial) {
    super.copy(source);

    this.specularMap = source.specularMap;
    if (source.specular) {
      this.specular?.copy(source.specular);
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

interface GLTFMeshStandardSGMaterialParams
  extends Three.MeshStandardMaterialParameters {
  glossiness: number;
  specular: Three.Color;
  specularMap: any;
  glossinessMap: any;
}

export class GLTFMaterialsPbrSpecularGlossinessExtension extends MeshExtension {
  name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
  specularGlossinessParams = [
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

  getMaterialType() {
    return GLTFMeshStandardSGMaterial;
  }

  extendParams = (
    params: Three.MeshStandardMaterialParameters,
    materialDef: GSpec.Material
  ) => {
    const pbrSpecularGlossiness = materialDef.extensions?.[this.name];
    if (!!!pbrSpecularGlossiness) {
      return Promise.resolve();
    }
    const materialParams = params as GLTFMeshStandardSGMaterialParams;
    materialParams.color = new Three.Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const pending: Promise<Three.Texture>[] = [];

    if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
      const array = pbrSpecularGlossiness.diffuseFactor;

      materialParams.color.fromArray(array);
      materialParams.opacity = array[3];
    }

    if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
      pending.push(
        this.context.assignTexture(
          materialParams,
          "map",
          pbrSpecularGlossiness.diffuseTexture
        )
      );
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
      pending.push(
        this.context.assignTexture(
          materialParams,
          "glossinessMap",
          specGlossMapDef
        )
      );
      pending.push(
        this.context.assignTexture(
          materialParams,
          "specularMap",
          specGlossMapDef
        )
      );
    }

    return Promise.all(pending);
  };

  createMaterial = (params: Three.MeshStandardMaterialParameters) => {
    const materialParams = params as GLTFMeshStandardSGMaterialParams;
    const material = new GLTFMeshStandardSGMaterial(materialParams);
    material.fog = true;

    material.color = materialParams.color as Three.Color;

    material.map = materialParams.map === undefined ? null : materialParams.map;

    material.lightMap = null;
    material.lightMapIntensity = 1.0;

    material.aoMap =
      materialParams.aoMap === undefined ? null : materialParams.aoMap;
    material.aoMapIntensity = 1.0;

    material.emissive = materialParams.emissive as Three.Color;
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
