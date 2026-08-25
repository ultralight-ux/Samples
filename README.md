# Ultralight Samples

A set of small, self-contained applications that walk you through embedding Ultralight, from a
headless render all the way up to a multi-tab browser.

Samples are numbered in learning order-- start at `01-render-to-png` and work your way up. Each
directory holds everything its sample needs (code, assets, and a CMake target), so you can copy
one out and use it as the starting point for your own application.

## Building

The samples build as part of the SDK. Run this from the root of the SDK directory:

```
cmake -B build && cmake --build build --config Release && cmake --install build --config Release
```

Each sample is installed to `build/out/Samples/<name>/` along with everything it needs to run.
The SDK also includes VS Code integration with per-sample launch configurations (see the README
in the SDK root).

## Core

These teach the fundamentals: rendering, the AppCore application framework, file loading, and
the C API.

| Sample | What it teaches |
| --- | --- |
| `01-render-to-png` | Rendering a page to a PNG with the barebones Renderer API (no window, CPU renderer). A C version of the same program lives in its `C-API/` directory. |
| `02-basic-app` | The smallest AppCore application: a window, a panel, and a local HTML page. |
| `03-panel-layouts` | The window's layout tree: splitting the window into panels that respond to resizing automatically. |
| `04-data-bindings` | Binding plain C++ state to a page declaratively: a game thread mutates a dashboard model and calls Sync(); the page's `ul-*` markup does the rest. |
| `05-javascript-bridge` | Connecting page JavaScript to native C++: typed functions the page calls (and times), plus native-to-page events. |
| `06-dom-api` | Driving a page with its JavaScript turned off entirely, through the native DOM API. |
| `07-file-loading` | Loading assets with the FileSystem API and the default implementations AppCore provides for each platform. |
| `08-intro-to-c-api` | Building an application through the C API. |

## Game

Integrating the library into an application that owns its own rendering loop.

| Sample | What it teaches |
| --- | --- |
| `09-opengl-integration` | Embedding web content into an existing OpenGL application with a custom Surface, including input event translation. |

## App

Larger desktop-application patterns built on AppCore.

| Sample | What it teaches |
| --- | --- |
| `10-native-look-and-feel` | A frameless window with HTML chrome: custom title bar and caption buttons, a native backdrop material, a popup menu, and OS light/dark theming. |
| `11-multi-window` | Spawning and coordinating multiple application windows. |
| `12-web-browser` | A multi-tab web browser with a built-in inspector. |
