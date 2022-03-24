import { AssetsResource, RemoteResource, Resource } from "doric";
import models from "../assets/glTF-Sample-Models/2.0/model-index.json";

export const DemoData = [
  {
    title: "ktx2",
  },
  {
    title: "glTF",
    resource: new AssetsResource(
      `glTF-Sample-Models/2.0/StainedGlassLamp/glTF/StainedGlassLamp.gltf`
    ),
  },
  {
    title: "glTF-JPG-PNG",
    resource: new AssetsResource(
      `glTF-Sample-Models/2.0/StainedGlassLamp/glTF-JPG-PNG/StainedGlassLamp.gltf`
    ),
  },
  {
    title: "glTF-KTX-BasisU",
    resource: new AssetsResource(
      `glTF-Sample-Models/2.0/StainedGlassLamp/glTF-KTX-BasisU/StainedGlassLamp.gltf`
    ),
  },
  {
    title: "圆形展厅",
    resource: new AssetsResource("圆形展厅.glb"),
  },
  {
    title: "Old Bicycle",
    resource: new AssetsResource("Old Bicycle.glb"),
  },
  {
    title: "LittlestTokyo",
    resource: new AssetsResource("threejs/LittlestTokyo/LittlestTokyo.gltf"),
  },
  {
    title: "LeePerrySmith",
    resource: new AssetsResource("threejs/LeePerrySmith/LeePerrySmith.gltf"),
  },
  {
    title: "DracoTest",
    resource: new RemoteResource(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LittlestTokyo.glb"
    ),
  },
  ...models.map((e) => {
    let resource: Resource | undefined = undefined;
    if (e.variants["glTF-Draco"]) {
      resource = new AssetsResource(
        `glTF-Sample-Models/2.0/${e.name}/glTF-Draco/${e.variants["glTF-Draco"]}`
      );
    } else if (e.variants["glTF-Binary"]) {
      resource = new AssetsResource(
        `glTF-Sample-Models/2.0/${e.name}/glTF-Binary/${e.variants["glTF-Binary"]}`
      );
    } else if (e.variants["glTF"]) {
      resource = new AssetsResource(
        `glTF-Sample-Models/2.0/${e.name}/glTF/${e.variants["glTF"]}`
      );
    } else if (e.variants["glTF-Embedded"]) {
      resource = new AssetsResource(
        `glTF-Sample-Models/2.0/${e.name}/glTF-Embedded/${e.variants["glTF-Embedded"]}`
      );
    }
    return {
      title: e.name,
      resource: resource,
      screenshot: new AssetsResource(
        `glTF-Sample-Models/2.0/${e.name}/${e.screenshot}`
      ),
    };
  }),
];
