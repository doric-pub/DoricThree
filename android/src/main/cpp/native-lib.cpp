#include <jni.h>

#include <android/log.h>

#include "draco/javascript/emscripten/decoder_webidl_wrapper.h"

#include "draco/core/cycle_timer.h"

//
// Created by pengfei.zhou on 2022/3/2.
//

#define  ADB_LOG_TAG    "jsc-jni"
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

void pushNULL(std::vector<char> *bytes) {
}

void pushBoolean(std::vector<char> *bytes, bool b) {
    if (b) {
        bytes->push_back(1);
    } else {
        bytes->push_back(0);
    }
}

draco::DataType getDracoDataType(int attributeType) {
    switch (attributeType) {
        case 5126:
            return draco::DT_FLOAT32;
        case 5120:
            return draco::DT_INT8;
        case 5122:
            return draco::DT_INT16;
        case 5124:
            return draco::DT_INT32;
        case 5121:
            return draco::DT_UINT8;
        case 5123:
            return draco::DT_UINT16;
        case 5125:
            return draco::DT_UINT32;
        default:
            return draco::DT_INVALID;
    }
}

int getDracoDataSize(draco::DataType dt) {
    switch (dt) {
        case draco::DT_INT8:
        case draco::DT_UINT8:
            return 1;
        case draco::DT_INT16:
        case draco::DT_UINT16:
            return 2;
        case draco::DT_INT32:
        case draco::DT_UINT32:
            return 4;
        case draco::DT_INT64:
        case draco::DT_UINT64:
            return 8;
        case draco::DT_FLOAT32:
            return 4;
        case draco::DT_FLOAT64:
            return 8;
        case draco::DT_BOOL:
            return 1;
        default:
            return -1;
    }
}


jbyteArray decodeDraco(JNIEnv *env, jobject thiz, jobject byte_buffer,
                       jobjectArray attributes) {
    char *ptr = static_cast<char *>(env->GetDirectBufferAddress(byte_buffer));
    size_t size = env->GetDirectBufferCapacity(byte_buffer);
    draco::DecoderBuffer buffer;
    buffer.Init(ptr, size);
    Decoder decoder;
    draco::CycleTimer timer;
    auto geometryType = Decoder::GetEncodedGeometryType_Deprecated(&buffer);
    draco::PointCloud *pc = nullptr;
    if (geometryType == draco::TRIANGULAR_MESH) {
        timer.Start();
        pc = new draco::Mesh();
        auto status = decoder.DecodeBufferToMesh(&buffer, dynamic_cast<draco::Mesh *>(pc));
        if (!status->ok()) {
            LOGE("Draco:Decode Mesh error");
        }
    } else if (geometryType == draco::POINT_CLOUD) {
        timer.Start();
        pc = new draco::PointCloud();
        auto status = decoder.DecodeBufferToPointCloud(&buffer, pc);
        if (!status->ok()) {
            LOGE("Draco:Decode PointCloud error");
        }
    } else {
        LOGE("Draco: Unexpected geometry type");
        return nullptr;
    }

    size_t len = env->GetArrayLength(attributes);
    std::vector<char> vector;
    pushSize(&vector, len);
    for (size_t i = 0; i < len; i++) {
        auto jattribute = static_cast<jobjectArray>(env->GetObjectArrayElement(
                attributes, i));
        auto jname = static_cast<jstring>(env->GetObjectArrayElement(jattribute, 0));
        auto jattributeId = static_cast<jstring>(env->GetObjectArrayElement(jattribute, 1));
        auto jattributeType = static_cast<jstring>(env->GetObjectArrayElement(jattribute, 2));

        const char *name_ptr = env->GetStringUTFChars(jname, 0);
        const char *attributeId_ptr = env->GetStringUTFChars(jattributeId, 0);
        const char *attributeType_ptr = env->GetStringUTFChars(jattributeType, 0);

        int attributeId = std::stoi(attributeId_ptr);
        int attributeType = std::stoi(attributeType_ptr);

        auto attribute = decoder.GetAttributeByUniqueId(*pc, attributeId);

        auto numComponents = attribute->num_components();
        auto numPoints = pc->num_points();
        auto numValues = numPoints * numComponents;
        auto dataType = getDracoDataType(attributeType);
        auto byteLength = numValues * getDracoDataSize(dataType);
        auto ptr = (char *) malloc(byteLength);
        decoder.GetAttributeDataArrayForAllPoints(*pc, *attribute, dataType, byteLength, ptr);

        //attributeId
        pushSize(&vector, attributeId);
        //array
        pushBuffer(&vector, ptr, byteLength);
        //itemSize
        pushSize(&vector, numComponents);
        free(ptr);
        env->ReleaseStringUTFChars(jname, name_ptr);
        env->ReleaseStringUTFChars(jattributeId, attributeId_ptr);
        env->ReleaseStringUTFChars(jattributeType, attributeType_ptr);
    }
    if (geometryType == draco::TRIANGULAR_MESH) {
        auto *mesh = dynamic_cast<draco::Mesh *>(pc);
        auto numFaces = mesh->num_faces();
        auto numIndices = numFaces * 3;
        auto byteLength = numIndices * 4;
        auto ptr = (char *) malloc(byteLength);
        decoder.GetTrianglesUInt32Array(*mesh, byteLength, ptr);
        pushBuffer(&vector, ptr, byteLength);
        free(ptr);
    }
    int vectorSize = vector.size();
    jbyteArray bytes = env->NewByteArray(vectorSize);
    env->SetByteArrayRegion(bytes, 0, vectorSize, (jbyte *) (&vector[0]));
    return bytes;
}

extern "C"
JNIEXPORT jbyteArray JNICALL
Java_pub_doric_library_three_DoricDracoPlugin_decodeDraco(JNIEnv *env, jobject thiz,
                                                          jobject byte_buffer,
                                                          jobjectArray attributes) {
    return decodeDraco(env, thiz, byte_buffer, attributes);
}