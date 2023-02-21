include(Platform)

if (${ALLINONE_BUILD})
    set(SDK_ROOT "${UL_SDK_PATH}")
else ()
    message(FATAL_ERROR "TODO: Handle non-all-in-one build.")
endif ()

set(ULTRALIGHT_INCLUDE_DIR "${SDK_ROOT}/include")
set(ULTRALIGHT_BINARY_DIR "${SDK_ROOT}/bin")
set(ULTRALIGHT_INSPECTOR_DIR "${SDK_ROOT}/inspector")
set(ULTRALIGHT_RESOURCES_DIR "${SDK_ROOT}/resources")
set(ULTRALIGHT_LIBRARY_DIR "${SDK_ROOT}/bin"
                           "${SDK_ROOT}/lib")

macro(add_console_app APP_NAME)
    include_directories("${ULTRALIGHT_INCLUDE_DIR}")
    link_directories("${ULTRALIGHT_LIBRARY_DIR}")
    link_libraries(UltralightCore Ultralight WebCore AppCore)

    if (UL_PLATFORM MATCHES "MacOS")
        SET(CMAKE_INSTALL_RPATH ".")
    endif ()

    add_executable(${APP_NAME} ${ARGN})

    set(INSTALL_PATH "${INSTALL_DIR}/${APP_NAME}")

    INSTALL(TARGETS ${APP_NAME}
        RUNTIME DESTINATION "${INSTALL_PATH}"
        BUNDLE  DESTINATION "${INSTALL_PATH}")

    INSTALL(DIRECTORY "${ULTRALIGHT_BINARY_DIR}/" DESTINATION "${INSTALL_PATH}")
    INSTALL(DIRECTORY "${ULTRALIGHT_RESOURCES_DIR}" DESTINATION "${INSTALL_PATH}/assets")
    INSTALL(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/assets/" DESTINATION "${INSTALL_PATH}/assets" OPTIONAL)
endmacro ()

macro(add_app APP_NAME)
    include_directories("${ULTRALIGHT_INCLUDE_DIR}")
    link_directories("${ULTRALIGHT_LIBRARY_DIR}")
    link_libraries(UltralightCore AppCore Ultralight WebCore)

    add_executable(${APP_NAME} WIN32 MACOSX_BUNDLE ${ARGN})

    if (UL_PLATFORM MATCHES "MacOS")
        # Enable High-DPI on macOS through our custom Info.plist template
        set_target_properties(${APP_NAME} PROPERTIES MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_SOURCE_DIR}/../cmake/Info.plist.in) 
    endif()

    if (UL_PLATFORM MATCHES "Windows")
        # Use main instead of WinMain for Windows subsystem executables
        set_target_properties(${APP_NAME} PROPERTIES LINK_FLAGS "/ENTRY:mainCRTStartup")
    endif()

    set(INSTALL_PATH "${INSTALL_DIR}/${APP_NAME}")

    INSTALL(TARGETS ${APP_NAME}
        RUNTIME DESTINATION "${INSTALL_PATH}"
        BUNDLE  DESTINATION "${INSTALL_PATH}")

    INSTALL(DIRECTORY "${ULTRALIGHT_BINARY_DIR}/" DESTINATION "${INSTALL_PATH}")
    INSTALL(DIRECTORY "${ULTRALIGHT_RESOURCES_DIR}" DESTINATION "${INSTALL_PATH}/assets")
    INSTALL(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/assets/" DESTINATION "${INSTALL_PATH}/assets" OPTIONAL)
endmacro ()
