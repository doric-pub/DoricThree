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
#import "decoder_webidl_wrapper.h"
#import "DoricDracoPlugin.h"

void pushWithEndian(std::vector<char> *bytes, char *p, int len) {
    for (int i = len - 1; i >= 0; i--) {
        bytes->push_back(*(p + i));
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

@interface DoricDracoPlugin ()
@end

@implementation DoricDracoPlugin


- (void)decode:(NSDictionary *)params withPromise:(DoricPromise *)promise {
    NSData *data = params[@"buffer"];
    NSDictionary <NSString *, NSNumber *> *attributeIDs = params[@"attributeIDs"];
    NSDictionary <NSString *, NSNumber *> *attributeTypes = params[@"attributeTypes"];
    draco::DecoderBuffer buffer;
    buffer.Init(static_cast<const char *>(data.bytes), data.length);
    Decoder decoder;
    auto geometryType = Decoder::GetEncodedGeometryType_Deprecated(&buffer);
    draco::PointCloud *pc = nullptr;
    if (geometryType == draco::TRIANGULAR_MESH) {
        pc = new draco::Mesh();
        auto status = decoder.DecodeBufferToMesh(&buffer, dynamic_cast<draco::Mesh *>(pc));
        if (!status->ok()) {
            [promise reject:@"Draco:Decode Mesh error"];
            return;
        }
    } else if (geometryType == draco::POINT_CLOUD) {
        pc = new draco::PointCloud();
        auto status = decoder.DecodeBufferToPointCloud(&buffer, pc);
        if (!status->ok()) {
            [promise reject:@"Draco:Decode PointCloud error"];
            return;
        }
    } else {
        [promise reject:@"Draco: Unexpected geometry type"];
        return;
    }
    uint32_t len = static_cast<uint32_t>(attributeIDs.count);
    std::vector<char> vector;
    pushSize(&vector, len);
    std::vector<char> *vector_ptr = &vector;
    [attributeIDs enumerateKeysAndObjectsUsingBlock:^(NSString *_Nonnull key, NSNumber *_Nonnull obj, BOOL *_Nonnull stop) {
        auto attribute = decoder.GetAttributeByUniqueId(*pc, obj.longValue);
        NSNumber *attributeType = attributeTypes[key];
        auto numComponents = attribute->num_components();
        auto numPoints = pc->num_points();
        auto numValues = numPoints * numComponents;
        auto dataType = getDracoDataType(attributeType.intValue);
        auto byteLength = numValues * getDracoDataSize(dataType);
        auto ptr = (char *) malloc(byteLength);
        decoder.GetAttributeDataArrayForAllPoints(*pc, *attribute, dataType, byteLength, ptr);
        //attributeId
        pushSize(vector_ptr, (uint32_t) obj.longValue);
        //array
        pushBuffer(vector_ptr, ptr, (uint32_t) byteLength);
        //itemSize
        pushSize(vector_ptr, (uint32_t) numComponents);
        free(ptr);
    }];
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
    NSData *ret = [[NSData alloc] initWithBytes:&vector[0] length:vector.size()];
    [promise resolve:ret];
}
@end
