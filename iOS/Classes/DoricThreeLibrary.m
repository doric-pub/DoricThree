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
#import "DoricThreeLibrary.h"
#import "DoricDracoPlugin.h"

@implementation DoricThreeLibrary
- (void)load:(DoricRegistry *)registry {
    {
        NSString *path = [[NSBundle mainBundle] bundlePath];
        NSString *fullPath = [path stringByAppendingPathComponent:@"bundle_doric-three.js"];
        NSString *jsContent = [NSString stringWithContentsOfFile:fullPath encoding:NSUTF8StringEncoding error:nil];
        [registry registerJSBundle:jsContent withName:@"doric-three"];
    }
    {
        NSString *path = [[NSBundle mainBundle] bundlePath];
        NSString *fullPath = [path stringByAppendingPathComponent:@"bundle_three.js"];
        NSString *jsContent = [NSString stringWithContentsOfFile:fullPath encoding:NSUTF8StringEncoding error:nil];
        [registry registerJSBundle:jsContent withName:@"three"];
    }
    [registry registerNativePlugin:DoricDracoPlugin.class withName:@"draco"];
}
@end
