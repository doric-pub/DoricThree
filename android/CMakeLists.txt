# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html

# Sets the minimum version of CMake required to build the native library.

cmake_minimum_required(VERSION 3.6)

###############Draco start###############
set(DRACO_DIR ${CMAKE_CURRENT_LIST_DIR}/../third_party/draco)

add_library(draco STATIC IMPORTED)

set_target_properties(draco PROPERTIES
        IMPORTED_LOCATION ${DRACO_DIR}/android/${ANDROID_ABI}/libdraco.a
        )

add_library(doric_draco
        SHARED
        "src/main/cpp/native-lib-draco.cpp"
        "${DRACO_DIR}/include/draco/javascript/emscripten/decoder_webidl_wrapper.cc"
        )

target_include_directories(doric_draco PRIVATE
        ${DRACO_DIR}
        ${DRACO_DIR}/include)

find_library(log-lib
        log
        android
        stdc++
        atomic
        m)

target_link_libraries(doric_draco ${log-lib} draco)

###############Draco end###############

###############Ktx start###############
set(KTX_DIR ${CMAKE_CURRENT_LIST_DIR}/../third_party/basis_universal)

file(GLOB ktx_src
        "${KTX_DIR}/zstd/zstd.h"
        "${KTX_DIR}/zstd/zstd.c"
        "${KTX_DIR}/transcoder/*.h"
        "${KTX_DIR}/transcoder/*.inc"
        "${KTX_DIR}/transcoder/*.cpp"
        )
include_directories("${KTX_DIR}/transcoder")
add_library(doric_ktx
        SHARED
        ${ktx_src}
        "src/main/cpp/native-lib-ktx.cpp")
#target_include_directories(doric_ktx PRIVATE
#        "${KTX_DIR}/transcoder")

target_link_libraries(doric_ktx ${log-lib})
###############Ktx end###############
