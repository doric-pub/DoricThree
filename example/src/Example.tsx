import {
  Group,
  layoutConfig,
  navbar,
  createRef,
  jsx,
  Gravity,
  Text,
  Color,
  navigator,
  FlowLayout,
  FlowLayoutItem,
  VLayout,
  Image,
  ViewHolder,
  ViewModel,
  VMPanel,
  network,
  Resource,
  RemoteResource,
  ScaleType,
} from "doric";
import { DemoData } from "./data";
import { GLTFViewer } from "./GLTFViewer";
import { LoaderPanel } from "./Loader";
import { webgl_loader_gltf_fullscreen } from "./webgl_loader_gltf_fullscreen";
import { webgl_loader_texture_ktx2 } from "./webgl_loader_texture_ktx2";

interface ExamplesData {
  data: typeof DemoData;
}

class ListVH extends ViewHolder {
  flowlayoutRef = createRef<FlowLayout>();
  build(root: Group) {
    <FlowLayout
      parent={root}
      layoutConfig={layoutConfig().most()}
      rowSpace={10}
      columnSpace={10}
      ref={this.flowlayoutRef}
    />;
  }
}
class ListVM extends ViewModel<ExamplesData, ListVH> {
  onAttached(state: ExamplesData, vh: ListVH): void {
    // const url =
    //   "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0";
    // network(this.context)
    //   .get(`${url}/model-index.json`)
    //   .then((res) => {
    //     const data = JSON.parse(res.data) as {
    //       name: string;
    //       screenshot: string;
    //       variants: {
    //         glTF?: string;
    //         "glTF-Binary"?: string;
    //         "glTF-Draco"?: string;
    //         "glTF-Embedded"?: string;
    //       };
    //     }[];
    //     this.updateState((state) => {
    //       data
    //         .map((e) => {
    //           let resource: Resource | undefined = undefined;
    //           if (e.variants["glTF-Binary"]) {
    //             resource = new RemoteResource(
    //               `${url}/${e.name}/glTF-Binary/${e.variants["glTF-Binary"]}`
    //             );
    //           } else if (e.variants["glTF"]) {
    //             resource = new RemoteResource(
    //               `${url}/${e.name}/glTF/${e.variants["glTF"]}`
    //             );
    //           } else if (e.variants["glTF-Embedded"]) {
    //             resource = new RemoteResource(
    //               `${url}/${e.name}/glTF-Embedded/${e.variants["glTF-Embedded"]}`
    //             );
    //           } else {
    //             throw new Error("Resource cannot be empty");
    //           }
    //           return {
    //             title: e.name,
    //             resource: resource,
    //             screenshot: new RemoteResource(
    //               `${url}/${e.name}/${e.screenshot}`
    //             ),
    //           };
    //         })
    //         .forEach((e) => {
    //           state.data.push(e);
    //         });
    //     });
    //   });
  }
  onBind(state: ExamplesData, vh: ListVH): void {
    vh.flowlayoutRef.current.apply({
      itemCount: state.data.length,
      renderItem: (index) =>
        (
          <FlowLayoutItem
            layoutConfig={layoutConfig().mostWidth().fitHeight()}
            backgroundColor={Color.parse("#ecf0f1")}
            onClick={() => {
              if (index == 0) {
                navigator(this.context).push(webgl_loader_texture_ktx2, {
                  extra: { index },
                });
              } else if (index == 1) {
                navigator(this.context).push(webgl_loader_gltf_fullscreen, {
                  extra: { index },
                });
              } else {
                navigator(this.context).push(GLTFViewer, {
                  extra: { index },
                });
              }
            }}
          >
            <VLayout
              layoutConfig={layoutConfig().mostWidth().fitHeight()}
              space={10}
              padding={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                layoutConfig={layoutConfig().mostWidth().justHeight()}
                image={(state.data[index] as any).screenshot}
                scaleType={ScaleType.ScaleAspectFit}
                height={200}
              />
              <Text
                layoutConfig={layoutConfig()
                  .fit()
                  .configAlignment(Gravity.Center)}
                textSize={20}
              >
                {state.data[index].title}
              </Text>
            </VLayout>
          </FlowLayoutItem>
        ) as FlowLayoutItem,
    });
  }
}

@Entry
class ListPanel extends VMPanel<ExamplesData, ListVH> {
  onShow() {
    navbar(this.context).setTitle("GLTF examples");
  }

  getViewModelClass() {
    return ListVM;
  }

  getState(): ExamplesData {
    return {
      data: DemoData,
    };
  }

  getViewHolderClass() {
    return ListVH;
  }
}
