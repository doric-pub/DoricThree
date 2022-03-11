/*
 * Copyright [2022] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package pub.doric.library.three;

import com.facebook.soloader.SoLoader;
import com.github.pengfeizhou.jscore.JSArrayBuffer;
import com.github.pengfeizhou.jscore.JSObject;
import com.github.pengfeizhou.jscore.JSValue;
import com.github.pengfeizhou.jscore.JavaValue;

import java.nio.ByteBuffer;
import java.util.ArrayList;

import pub.doric.DoricContext;
import pub.doric.extension.bridge.DoricMethod;
import pub.doric.extension.bridge.DoricPlugin;
import pub.doric.extension.bridge.DoricPromise;
import pub.doric.plugin.DoricJavaPlugin;

/**
 * @Description: Decode draco data
 * @Author: pengfei.zhou
 * @CreateDate: 2022/3/2
 */
@DoricPlugin(name = "draco")
public class DoricDracoPlugin extends DoricJavaPlugin {
    static {
        SoLoader.loadLibrary("doric_draco");
    }

    public DoricDracoPlugin(DoricContext doricContext) {
        super(doricContext);
    }

    @DoricMethod
    public void decode(JSObject jsObject, DoricPromise promise) throws Exception {
        JSArrayBuffer jsArrayBuffer = jsObject.getProperty("buffer").asArrayBuffer();
        JSObject attributeIDs = jsObject.getProperty("attributeIDs").asObject();
        JSObject attributeTypes = jsObject.getProperty("attributeTypes").asObject();
        ArrayList<String[]> arrayList = new ArrayList<>();
        for (String name : attributeIDs.propertySet()) {
            int id = attributeIDs.getProperty(name).asNumber().toInt();
            JSValue value = attributeTypes.getProperty(name);
            if (!value.isNumber()) {
                throw new Exception("Decode error:parameter is illegal");
            }
            int type = value.asNumber().toInt();
            String[] entity = {name, String.valueOf(id), String.valueOf(type)};
            arrayList.add(entity);
        }
        String[][] array = arrayList.toArray(new String[0][0]);
        byte[] decodedData = this.decodeDraco(jsArrayBuffer.getByteBuffer(), array);
        promise.resolve(new JavaValue(decodedData));
    }

    public native byte[] decodeDraco(ByteBuffer byteBuffer, Object[][] attributes);
}
