import {
  Panel,
  Group,
  layoutConfig,
  navbar,
  AssetsResource,
  jsx,
  Gravity,
  Text,
  List,
  ListItem,
  Color,
  navigator,
  FlowLayout,
  FlowLayoutItem,
  VLayout,
  Image,
} from "doric";
import { DemoData } from "./data";
import { LoaderPanel } from "./Loader";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF examples");
  }
  build(root: Group) {
    <FlowLayout
      parent={root}
      layoutConfig={layoutConfig().most()}
      itemCount={DemoData.length}
      rowSpace={10}
      renderItem={(index) =>
        (
          <FlowLayoutItem
            layoutConfig={layoutConfig().mostWidth().fitHeight()}
            backgroundColor={Color.parse("#ecf0f1")}
            onClick={() => {
              navigator(this.context).push(LoaderPanel, { extra: { index } });
            }}
          >
            <VLayout
              layoutConfig={layoutConfig().mostWidth().fitHeight()}
              space={10}
              padding={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                layoutConfig={layoutConfig().mostWidth().fitHeight()}
                image={(DemoData[index] as any).screenshot}
              />
              <Text
                layoutConfig={layoutConfig()
                  .fit()
                  .configAlignment(Gravity.Center)}
                textSize={20}
              >
                {DemoData[index].title}
              </Text>
            </VLayout>
          </FlowLayoutItem>
        ) as FlowLayoutItem
      }
    />;
  }
}
