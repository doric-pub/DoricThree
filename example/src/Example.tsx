import {
  Panel,
  Group,
  layoutConfig,
  navbar,
  AssetsResource,
  Image,
  VLayout,
  jsx,
} from "doric";
import { GLTFView } from "doric-gltf";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF");
  }
  build(root: Group) {
    <VLayout parent={root} layoutConfig={layoutConfig().most()}>
      <Image image={new AssetsResource("logo_doric.png")} />
      <GLTFView
        url="threejs/LittlestTokyo/LittlestTokyo.gltf"
        layoutConfig={layoutConfig().just()}
        width={300}
        height={300}
        context={this.context}
      />
    </VLayout>;
  }
}
