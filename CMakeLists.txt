project(Samples C CXX)
cmake_minimum_required(VERSION 3.3.2)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

list(PREPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_LIST_DIR}/cmake)
include(Common)

set(INSTALL_DIR "Samples")

add_subdirectory("Sample 1 - Render to PNG")
add_subdirectory("Sample 2 - Basic App")
add_subdirectory("Sample 3 - Resizable App")
add_subdirectory("Sample 4 - JavaScript")
add_subdirectory("Sample 5 - File Loading")
add_subdirectory("Sample 6 - Intro to C API")
add_subdirectory("Sample 7 - OpenGL Integration")
add_subdirectory("Sample 8 - Web Browser")
add_subdirectory("Sample 9 - Multi Window")

if (${ALLINONE_BUILD})
    add_custom_target(install_samples ALL "${CMAKE_COMMAND}" 
        -P "${CMAKE_CURRENT_BINARY_DIR}/cmake_install.cmake" 
        DEPENDS Sample1 Sample2 Sample3 Sample4 Sample5 Sample6 Sample7 Sample8 Sample9) 
endif ()