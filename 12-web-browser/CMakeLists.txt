set(SOURCES "src/Browser.h"
            "src/Browser.cpp"
            "src/Tab.h"
            "src/Tab.cpp"
            "src/UI.h"
            "src/UI.cpp"
            "src/main.cpp")

set(NEEDS_INSPECTOR TRUE)
add_app(12-web-browser ${SOURCES})
