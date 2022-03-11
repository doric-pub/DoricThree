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

#include <jni.h>

#include <android/log.h>

//
// Created by pengfei.zhou on 2022/3/11.
//

#define  ADB_LOG_TAG    "doric-ktx-jni"
#ifdef DEBUG
#define  LOGD(...)  __android_log_print(ANDROID_LOG_DEBUG, ADB_LOG_TAG, __VA_ARGS__)
#define  LOGE(...)  __android_log_print(ANDROID_LOG_ERROR, ADB_LOG_TAG, __VA_ARGS__)
#else
#define  LOGD(...)
#define  LOGE(...)
#endif

bool gSmallEndian;

/**
 * Called when loaded.
 * */
jint JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env;
    LOGD("JNI_OnLoad called");
    if (vm->GetEnv((void **) &env, JNI_VERSION_1_4) != JNI_OK) {
        LOGE("Failed to get the environment using GetEnv()");
        return -1;
    }
    union w {
        int a;
        char b;
    } c;
    c.a = 1;
    gSmallEndian = (c.b == 1);
    return JNI_VERSION_1_4;
}


//void pushWithEndian(std::vector<char> *bytes, char *p, int len) {
//    if (gSmallEndian) {
//        for (int i = len - 1; i >= 0; i--) {
//            bytes->push_back(*(p + i));
//        }
//    } else {
//        for (int i = 0; i < len; i++) {
//            bytes->push_back(*(p + i));
//        }
//    }
//}
//
//
//void pushSize(std::vector<char> *bytes, uint32_t val) {
//    pushWithEndian(bytes, (char *) &val, sizeof(val));
//}
//
//void pushBuffer(std::vector<char> *bytes, char *p, uint32_t len) {
//    pushSize(bytes, len);
//    for (size_t s = 0; s < len; s++) {
//        bytes->push_back(*(p + s));
//    }
//}
