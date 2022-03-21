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
#include <vector>
#include "basisu_transcoder.h"

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

#define KTX2_MAGIC 0xDEADBEE2
using namespace basist;

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


void pushWithEndian(std::vector<char> *bytes, char *p, int len) {
    if (gSmallEndian) {
        for (int i = len - 1; i >= 0; i--) {
            bytes->push_back(*(p + i));
        }
    } else {
        for (int i = 0; i < len; i++) {
            bytes->push_back(*(p + i));
        }
    }
}


void pushSize(std::vector<char> *bytes, uint32_t val) {
    pushWithEndian(bytes, (char *) &val, sizeof(val));
}

void pushBuffer(std::vector<char> *bytes, char *p, uint32_t len) {
    pushSize(bytes, len);
    for (size_t s = 0; s < len; s++) {
        bytes->push_back(*(p + s));
    }
}

bool isPowerOfTwo(uint32_t v) {
    if (v <= 2) {
        return true;
    }
    return (v & (v - 1)) == 0;
}

enum BasisFormat {
    BasisFormatInvalid = -1,
    ETC1S = 0,
    UASTC_4x4 = 1,
};

enum TranscoderFormat {
    TranscoderFormatInvalid = -1,
    ETC1 = 0,
    ETC2 = 1,
    BC1 = 2,
    BC3 = 3,
    BC4 = 4,
    BC5 = 5,
    BC7_M6_OPAQUE_ONLY = 6,
    BC7_M5 = 7,
    PVRTC1_4_RGB = 8,
    PVRTC1_4_RGBA = 9,
    ASTC_4x4 = 10,
    ATC_RGB = 11,
    ATC_RGBA_INTERPOLATED_ALPHA = 12,
    RGBA32 = 13,
    RGB565 = 14,
    BGR565 = 15,
    RGBA4444 = 16,
};

enum EngineFormat {
    EngineFormatInvalid = -1,
    RGBAFormat = 0,
    RGBA_ASTC_4x4_Format = 1,
    RGBA_BPTC_Format = 2,
    RGBA_ETC2_EAC_Format = 3,
    RGBA_PVRTC_4BPPV1_Format = 4,
    RGBA_S3TC_DXT5_Format = 5,
    RGB_ETC1_Format = 6,
    RGB_ETC2_Format = 7,
    RGB_PVRTC_4BPPV1_Format = 8,
    RGB_S3TC_DXT1_Format = 9,
};

struct FormatOption {
    BasisFormat basisFormat[2];
    TranscoderFormat transcoderFormat[2];
    EngineFormat engineFormat[2];
    int priorityETC1S;
    int priorityUASTC;
    bool needsPowerOfTwo;
};


FormatOption option_astc = {
        {UASTC_4x4, BasisFormatInvalid},
        {ASTC_4x4, ASTC_4x4},
        {RGBA_ASTC_4x4_Format, RGBA_ASTC_4x4_Format},
        INT_MAX,
        1,
        false
};

FormatOption option_bptc = {
        {ETC1S, UASTC_4x4},
        {BC7_M5, BC7_M5},
        {RGBA_BPTC_Format, RGBA_BPTC_Format},
        3,
        2,
        false
};

FormatOption option_dxt = {
        {ETC1S, UASTC_4x4},
        {BC1, BC3},
        {RGB_S3TC_DXT1_Format, RGBA_S3TC_DXT5_Format},
        4,
        5,
        false
};

FormatOption option_etc2 = {
        {ETC1S, UASTC_4x4},
        {ETC1, ETC2},
        {RGB_ETC2_Format, RGBA_ETC2_EAC_Format},
        1,
        3,
        false
};

FormatOption option_etc1 = {
        {ETC1S, UASTC_4x4},
        {ETC1, TranscoderFormatInvalid},
        {RGB_ETC1_Format, EngineFormatInvalid},
        2,
        4,
        false
};

FormatOption option_pvrtc = {
        {ETC1S, UASTC_4x4},
        {PVRTC1_4_RGB, PVRTC1_4_RGBA},
        {RGB_PVRTC_4BPPV1_Format, RGBA_PVRTC_4BPPV1_Format},
        5,
        6,
        true
};


static bool g_basis_initialized_flag;

void basis_init() {
    if (g_basis_initialized_flag)
        return;
    basisu_transcoder_init();

    g_basis_initialized_flag = true;
}


bool SortByETC1S(const FormatOption &v1, const FormatOption &v2) {
    return v1.priorityETC1S < v2.priorityETC1S;
}

bool SortByUASTC(const FormatOption &v1, const FormatOption &v2) {
    return v1.priorityUASTC < v2.priorityUASTC;
}

jbyteArray transcode(JNIEnv *env, jobject thiz,
                     jobject byte_buffer, jlong extension_flag) {
    basis_init();
    char *ptr = static_cast<char *>(env->GetDirectBufferAddress(byte_buffer));
    size_t size = env->GetDirectBufferCapacity(byte_buffer);
    ktx2_transcoder transcoder;
    if (!transcoder.init(ptr, size)) {
        LOGE("transcoder.init() failed!");
        return nullptr;
    }
    BasisFormat basisFormat = transcoder.is_uastc() ? UASTC_4x4 : ETC1S;
    auto width = transcoder.get_width();
    auto height = transcoder.get_height();
    auto levels = transcoder.get_levels();
    auto hasAlpha = transcoder.get_has_alpha();
    auto dfdTransferFn = transcoder.get_dfd_transfer_func();
    auto dfdFlags = transcoder.get_dfd_flags();
    if (!width || !height || !levels) {
        transcoder.clear();
        LOGE("Invalid texture");
        return nullptr;
    }
    transcoder.start_transcoding();
    //
    bool powerOfTwo = isPowerOfTwo(width) && isPowerOfTwo(height);
    std::vector<FormatOption> options;

    bool astcSupported = (extension_flag & 0x1) == 0x1;
    bool etc1Supported = (extension_flag & (0x1 << 1)) == (0x1 << 1);
    bool etc2Supported = (extension_flag & (0x1 << 2)) == (0x1 << 2);
    bool dxtSupported = (extension_flag & (0x1 << 3)) == (0x1 << 3);;
    bool bptcSupported = (extension_flag & (0x1 << 4)) == (0x1 << 4);;
    bool pvrtcSupported = (extension_flag & (0x1 << 5)) == (0x1 << 5);;

    if (astcSupported) {
        options.push_back(option_astc);
    }
    if (etc1Supported) {
        options.push_back(option_etc1);
    }
    if (etc2Supported) {
        options.push_back(option_etc2);
    }
    if (dxtSupported) {
        options.push_back(option_dxt);
    }
    if (bptcSupported) {
        options.push_back(option_bptc);
    }
    if (pvrtcSupported) {
        options.push_back(option_pvrtc);
    }
    if (basisFormat == UASTC_4x4) {
        std::sort(options.begin(), options.end(), SortByUASTC);
    } else {
        std::sort(options.begin(), options.end(), SortByETC1S);
    }
    TranscoderFormat transcoderFormat = RGBA32;
    EngineFormat engineFormat = RGBAFormat;
    for (auto option : options) {
        bool includeFormat = false;
        for (auto &j : option.basisFormat) {
            if (j == basisFormat) {
                includeFormat = true;
                break;
            }
        }
        if (!includeFormat) {
            continue;
        }
        if (hasAlpha && option.transcoderFormat[1] < 0) {
            continue;
        }
        if (option.needsPowerOfTwo && !powerOfTwo) {
            continue;
        }
        transcoderFormat = option.transcoderFormat[hasAlpha ? 1 : 0];
        engineFormat = option.engineFormat[hasAlpha ? 1 : 0];
    }
    std::vector<char> vector;
    //width
    pushSize(&vector, width);
    //height
    pushSize(&vector, height);
    //hasAlpha
    pushSize(&vector, hasAlpha ? 1 : 0);
    //format
    pushSize(&vector, engineFormat);
    //dfdTransferFn
    pushSize(&vector, dfdTransferFn);
    //dfdFlags
    pushSize(&vector, dfdFlags);
    //levels
    pushSize(&vector, levels);
    for (uint32_t mip = 0; mip < levels; mip++) {
        ktx2_image_level_info info{};
        memset(&info, 0, sizeof(info));

        if (!transcoder.get_image_level_info(info, mip, 0, 0)) {
            transcoder.clear();
            LOGE("Transcoder get_image_level_info error");
            return nullptr;
        }

        uint32_t orig_width = info.m_orig_width, orig_height = info.m_orig_height, total_blocks = info.m_total_blocks;

        const auto transcoder_format = static_cast<transcoder_texture_format>(transcoderFormat);
        uint32_t bytesSize;
        uint32_t status;
        void *pOutput_blocks;
        if (basis_transcoder_format_is_uncompressed(transcoder_format)) {
            // Uncompressed formats are just plain raster images.
            const uint32_t bytes_per_pixel = basis_get_uncompressed_bytes_per_pixel(
                    transcoder_format);
            const uint32_t bytes_per_line = orig_width * bytes_per_pixel;
            bytesSize = bytes_per_line * orig_height;
            pOutput_blocks = malloc(bytesSize);
            status = transcoder.transcode_image_level(
                    mip, 0, 0,
                    pOutput_blocks, orig_width * orig_height,
                    transcoder_format,
                    0,
                    orig_width,
                    orig_height,
                    -1, -1,
                    nullptr);

        } else {
            // Compressed formats are 2D arrays of blocks.
            const uint32_t bytes_per_block = basis_get_bytes_per_block_or_pixel(transcoder_format);

            if (transcoder_format == transcoder_texture_format::cTFPVRTC1_4_RGB ||
                transcoder_format == transcoder_texture_format::cTFPVRTC1_4_RGBA) {
                // For PVRTC1, Basis only writes (or requires) total_blocks * bytes_per_block. But GL requires extra padding for very small textures:
                // https://www.khronos.org/registry/OpenGL/extensions/IMG/IMG_texture_compression_pvrtc.txt
                const uint32_t lWidth = (orig_width + 3) & ~3;
                const uint32_t lHeight = (orig_height + 3) & ~3;
                bytesSize = (std::max(8U, lWidth) * std::max(8U, lHeight) * 4 + 7) / 8;
            } else {
                bytesSize = total_blocks * bytes_per_block;
            }
            pOutput_blocks = malloc(bytesSize);

            status = transcoder.transcode_image_level(
                    mip, 0, 0,
                    pOutput_blocks, bytesSize / bytes_per_block,
                    transcoder_format,
                    0,
                    0,
                    0,
                    -1, -1,
                    nullptr);
        }
        if (!status) {
            free(pOutput_blocks);
            transcoder.clear();
            LOGE("transcodeImage failed");
            return nullptr;
        }
        //mipWidth
        pushSize(&vector, orig_width);
        //mipHeight
        pushSize(&vector, orig_height);
        //data
        pushBuffer(&vector, (char *) pOutput_blocks, bytesSize);
        free(pOutput_blocks);
    }
    transcoder.clear();
    size_t vectorSize = vector.size();
    jbyteArray bytes = env->NewByteArray(vectorSize);
    env->SetByteArrayRegion(bytes, 0, vectorSize, (jbyte *) (&vector[0]));
    return bytes;
}

extern "C"
JNIEXPORT jbyteArray JNICALL
Java_pub_doric_library_three_DoricKTXPlugin_decodeKTX2(JNIEnv *env, jobject thiz,
                                                       jobject byte_buffer, jlong extension_flag) {
    return transcode(env, thiz, byte_buffer, extension_flag);
}