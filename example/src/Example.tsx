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
} from "doric";
import { DemoData } from "./data";
import { LoaderPanel } from "./Loader";

@Entry
class Example extends Panel {
  onShow() {
    navbar(context).setTitle("GLTF examples");
  }
  build(root: Group) {
    <List
      parent={root}
      layoutConfig={layoutConfig().most()}
      itemCount={DemoData.length}
      renderItem={(index) =>
        (
          <ListItem
            layoutConfig={layoutConfig().mostWidth().justHeight()}
            height={50}
            padding={{ left: 20 }}
            backgroundColor={
              index % 2 === 0 ? Color.parse("#ecf0f1") : Color.parse("#95a5a6")
            }
            onClick={() => {
              navigator(this.context).push(LoaderPanel, { extra: { index } });
            }}
          >
            <Text
              layoutConfig={layoutConfig()
                .fit()
                .configAlignment(Gravity.Center)}
              textSize={20}
            >
              {DemoData[index].title}
            </Text>
          </ListItem>
        ) as ListItem
      }
    />;
  }
}
