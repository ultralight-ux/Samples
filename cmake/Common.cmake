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

get_filename_component(INFO_PLIST_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/Info.plist.in" REALPATH)
get_filename_component(ENTITLEMENTS_PLIST_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/Entitlements.plist" REALPATH)

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
        # Include Entitlements.plist
        set_source_files_properties(${ENTITLEMENTS_PLIST_PATH} PROPERTIES MACOSX_PACKAGE_LOCATION "Contents")

        # Enable High-DPI on macOS through our custom Info.plist template
        set_target_properties(${APP_NAME} PROPERTIES
            BUNDLE True
            MACOSX_BUNDLE_GUI_IDENTIFIER ultralight.${APP_NAME}
            MACOSX_BUNDLE_BUNDLE_NAME ${APP_NAME}
            MACOSX_BUNDLE_EXECUTABLE_NAME ${APP_NAME}
            MACOSX_BUNDLE_BUNDLE_VERSION "1.0"
            MACOSX_BUNDLE_SHORT_VERSION_STRING "1.0"
            MACOSX_BUNDLE_INFO_PLIST ${INFO_PLIST_PATH}
        )

        set(INSTALL_PATH "${INSTALL_DIR}/${APP_NAME}.app")
        set(BUNDLE_PATH ${CMAKE_CURRENT_BINARY_DIR}/${APP_NAME}.app)
    
        configure_file(
            ${CMAKE_CURRENT_SOURCE_DIR}/../cmake/FixBundle.cmake.in
            ${CMAKE_CURRENT_BINARY_DIR}/FixBundle.cmake
            @ONLY
            )
    
        install(SCRIPT ${CMAKE_CURRENT_BINARY_DIR}/FixBundle.cmake)
    
        # TODO: Handle code signing 
        set(CPACK_GENERATOR "BUNDLE")
        set(CPACK_BUNDLE_APPLE_ENTITLEMENTS ${ENTITLEMENTS_PLIST_PATH})

        include(CPack)
    
        set(ASSET_PATH "${BUNDLE_PATH}/Contents/Resources/assets")

        # Install Entitlements.plist to the Contents folder of the app bundle
        INSTALL(FILES ${ENTITLEMENTS_PLIST_PATH} DESTINATION "${BUNDLE_PATH}/Contents")
    
        INSTALL(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/assets/" DESTINATION "${ASSET_PATH}" OPTIONAL)
        INSTALL(DIRECTORY "${ULTRALIGHT_RESOURCES_DIR}" DESTINATION "${ASSET_PATH}")
        if (NEEDS_INSPECTOR)
            INSTALL(DIRECTORY "${ULTRALIGHT_INSPECTOR_DIR}" DESTINATION "${ASSET_PATH}")
        endif ()
    
        INSTALL(TARGETS ${APP_NAME}
            RUNTIME DESTINATION "${INSTALL_PATH}" PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
            BUNDLE  DESTINATION "${INSTALL_DIR}" PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
            )
    else ()

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
        if (NEEDS_INSPECTOR)
            INSTALL(DIRECTORY "${ULTRALIGHT_INSPECTOR_DIR}" DESTINATION "${INSTALL_PATH}/assets")
        endif ()
        INSTALL(DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/assets/" DESTINATION "${INSTALL_PATH}/assets" OPTIONAL)
    endif ()
endmacro ()
