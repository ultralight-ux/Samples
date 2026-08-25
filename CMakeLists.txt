cmake_minimum_required(VERSION 3.15.0)
project(Samples C CXX)

# The SDK's public headers require C++20; the C API samples build as C17.
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

list(PREPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_LIST_DIR}/cmake)
include(Common)

set(INSTALL_DIR "Samples")

add_subdirectory(01-render-to-png)
add_subdirectory(02-basic-app)
add_subdirectory(03-panel-layouts)
add_subdirectory(04-data-bindings)
add_subdirectory(05-javascript-bridge)
add_subdirectory(06-dom-api)
add_subdirectory(07-file-loading)
add_subdirectory(08-intro-to-c-api)
add_subdirectory(09-opengl-integration)
add_subdirectory(10-native-look-and-feel)
add_subdirectory(11-multi-window)
add_subdirectory(12-web-browser)

set(SAMPLES_TARGETS
    01-render-to-png
    01-render-to-png-c
    02-basic-app
    03-panel-layouts
    04-data-bindings
    05-javascript-bridge
    06-dom-api
    07-file-loading
    08-intro-to-c-api
    09-opengl-integration
    10-native-look-and-feel
    11-multi-window
    12-web-browser)

if (${ALLINONE_BUILD})
    foreach(target ${SAMPLES_TARGETS})
        add_dependencies(${target} GenerateSDK)
    endforeach()

    add_custom_target(install_samples ALL "${CMAKE_COMMAND}"
        -P "${CMAKE_CURRENT_BINARY_DIR}/cmake_install.cmake"
        DEPENDS ${SAMPLES_TARGETS})
endif ()
