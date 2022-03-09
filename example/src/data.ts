import { AssetsResource, Resource } from "doric";
//import models from "../assets/glTF-Sample-Models/2.0/model-index.json";

export const DemoData = [
  {
    title: "Old Bicycle",
    resource: new AssetsResource("Old Bicycle.glb"),
  },
  {
    title: "LittlestTokyo",
    resource: new AssetsResource("threejs/LittlestTokyo/LittlestTokyo.gltf"),
  },
  // ...models.map((e) => {
  //   let resource: Resource | undefined = undefined;
  //   if (e.variants["glTF-Binary"]) {
  //     resource = new AssetsResource(
  //       `glTF-Sample-Models/2.0/${e.name}/glTF-Binary/${e.variants["glTF-Binary"]}`
  //     );
  //   } else if (e.variants["glTF"]) {
  //     resource = new AssetsResource(
  //       `glTF-Sample-Models/2.0/${e.name}/glTF/${e.variants["glTF"]}`
  //     );
  //   } else if (e.variants["glTF-Embedded"]) {
  //     resource = new AssetsResource(
  //       `glTF-Sample-Models/2.0/${e.name}/glTF-Embedded/${e.variants["glTF-Embedded"]}`
  //     );
  //   }
  //   return {
  //     title: e.name,
  //     resource: resource,
  //     screenshot: new AssetsResource(
  //       `glTF-Sample-Models/2.0/${e.name}/${e.screenshot}`
  //     ),
  //   };
  // }),
];
