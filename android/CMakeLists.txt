# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html

# Sets the minimum version of CMake required to build the native library.

cmake_minimum_required(VERSION 3.6)

include_directories(src/main/cpp/)

set(LIB_DIR ${CMAKE_CURRENT_LIST_DIR}/src/main/libs)

set(DRACO_DIR ${CMAKE_CURRENT_LIST_DIR}/../third_party/draco)

add_library(draco STATIC IMPORTED)

set_target_properties(draco PROPERTIES
        IMPORTED_LOCATION ${LIB_DIR}/${ANDROID_ABI}/libdraco.a
        )

file(GLOB native_srcs "src/main/cpp/*.cpp")

list(APPEND native_srcs
        "${DRACO_DIR}/decoder_webidl_wrapper.cc"
        "${DRACO_DIR}/decoder_webidl_wrapper.h")

add_library(doric_draco
        SHARED
        ${native_srcs}
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

target_link_libraries(doric_draco
        ${log-lib}
        draco
        )

