#include <AppCore/CAPI.h>

///
///  Welcome to Sample 8!
///
///  In this sample we'll demonstrate how to set up a simple JavaScript app using only the C API.
///
///  We will bind a native C function into a page-visible namespace and use it to display a
///  welcome message in our HTML view.
///
///  __About the C API__
///
///  The C API is useful for porting the library to other languages or using it in scenarios that
///  are unsuitable for C++.
///
///  Most of the C++ API functionality is currently available via the CAPI headers with the
///  exception of some of the Platform API.
///
///  Both Ultralight and AppCore follow the same paradigm when it comes to ownership/destruction:
///  You should explicitly Destroy anything you Create.
///

/// Various globals
ULApp app = 0;
ULWindow window = 0;
ULPanel panel = 0;
ULView view = 0;
ULJSAPI api = 0;

/// Forward declaration of our OnUpdate callback.
void OnUpdate(void* user_data);

/// Forward declaration of our OnClose callback.
void OnClose(void* user_data, ULWindow window);

/// Forward declaration of our bound GetMessage callback.
ULJSValue GetMessage(void* user_data, ULJSContext ctx, ULJSValue this_value,
                     const ULJSValue* args, size_t argc, ULJSValue* exception);

///
/// We set up our application here.
///
void Init() {
  ///
  /// Create default settings/config
  ///
  ULSettings settings = ulCreateSettings();
  ULConfig config = ulCreateConfig();

  ///
  /// Create our App
  ///
  app = ulCreateApp(settings, config);

  ///
  /// Register a callback to handle app update logic.
  ///
  ulAppSetUpdateCallback(app, OnUpdate, 0, 0);

  ///
  /// Done using settings/config, make sure to destroy anything we create
  ///
  ulDestroySettings(settings);
  ulDestroyConfig(config);

  ///
  /// Create our window, make it 500x500 with a titlebar and resize handles.
  ///
  window = ulCreateWindow(ulAppGetMainMonitor(app), 500, 500, false,
    kWindowFlags_Titled | kWindowFlags_Resizable);

  ///
  /// Set our window title.
  ///
  ulWindowSetTitle(window, "Ultralight Sample 8 - Intro to C API");

  ///
  /// Register a callback to handle window close.
  ///
  ulWindowSetCloseCallback(window, OnClose, 0, 0);

  ///
  /// Add a panel that fills the window. Panels live in the window's layout tree and create an
  /// HTML view for us to display content in; the window manages their placement, sizing, DPI,
  /// input, and painting automatically (there is no resize handling to write).
  ///
  /// Passing NULL for the options and view-config uses the defaults (a full-window panel with
  /// a new View).
  ///
  panel = ulWindowAddPanel(window, 0, 0);

  ///
  /// Get the panel's view.
  ///
  /// **Note**:
  ///     This returns a new owned instance referring to the panel's View; we must destroy it
  ///     when we're done (it releases only our reference, never the panel's).
  ///
  view = ulPanelGetView(panel);

  ///
  /// Create an API registry rooted at the global namespace `app` and bind our native
  /// GetMessage() callback so the page can call it as `app.getMessage()`.
  ///
  /// The registry is a passive, View-independent set of bindings; register everything once at
  /// startup, before attaching it to a View.
  ///
  api = ulCreateJSAPI("app");
  ulJSAPIBindFunction(api, "getMessage", GetMessage, 0, 0);

  ///
  /// Attach the registry to our View before loading any content. The bindings are injected
  /// into each new page as it loads, so they survive navigation with no per-page setup.
  ///
  /// Passing NULL for the origin rules uses the default policy: only the application's own
  /// content (local file:/// pages and HTML you load directly) can see the bindings.
  ///
  ulViewAttachJSAPI(view, api, kULJSAPIAttachFlags_None, 0, 0);

  ///
  /// Load a file from the FileSystem.
  ///
  ///  **IMPORTANT**: Make sure `file:///` has three (3) forward slashes.
  ///
  ///  **Note**: You can configure the base path for the FileSystem in the Settings we passed to
  ///            ulCreateApp earlier.
  ///
  ULString url = ulCreateString("file:///app.html");
  ulViewLoadURL(view, url);
  ulDestroyString(url);
}

///
/// This is called continuously from the app's main run loop. You should update any app logic
/// inside this callback.
///
void OnUpdate(void* user_data) {
  /// We don't use this in this tutorial, just here for example.
}

///
/// This is called when the window is closed.
///
void OnClose(void* user_data, ULWindow window) {
  ulAppQuit(app);
}

///
/// This native callback is bound to `app.getMessage()` on the page.
///
/// It is invoked on the same thread the Renderer was created on, while script is executing.
///
ULJSValue GetMessage(void* user_data, ULJSContext ctx, ULJSValue this_value,
                     const ULJSValue* args, size_t argc, ULJSValue* exception) {
  ///
  /// Create a JavaScript string containing our welcome message and return it to the page.
  ///
  /// Ownership of the returned value transfers to the library (you can also return NULL for
  /// `undefined`). Values received in `args` are owned by the library and are only valid for
  /// the duration of this callback.
  ///
  return ulCreateJSValueStringFromCString(ctx, "Hello from C!");
}

///
/// We tear down our application here.
///
void Shutdown() {
  ///
  /// Explicitly destroy everything we created in Init().
  ///
  ulDestroyView(view);
  ulDestroyPanel(panel);
  ulDestroyWindow(window);
  ulDestroyJSAPI(api);
  ulDestroyApp(app);
}

int main() {
  ///
  /// Initialize the app.
  ///
  Init();

  ///
  /// Run the app until the window is closed. (This is a modal operation)
  ///
  ulAppRun(app);

  ///
  /// Shutdown the app.
  ///
  Shutdown();

  return 0;
}
