#include <Ultralight/CAPI.h>
#include <AppCore/CAPI.h>
#include <stdio.h>

#ifdef _WIN32
#include <windows.h>
#define sleep_ms(x) Sleep(x)
#else
#include <unistd.h>
#define sleep_ms(x) usleep((x)*1000)
#endif

///
///  Welcome to Sample 1 (for the C API)!
///
///  In this sample we'll load a local HTML file and render it to a PNG.
///
///  Quick overview of the steps we'll cover:
///
///   1. Define our Platform handlers.
///   2. Create the Renderer.
///   3. Create our View.
///   4. Load a local file into the View.
///   5. Run our own main loop until the page settles.
///   6. Render the View.
///   7. Get the rendered Bitmap and save it to a PNG.
///
///  Both Ultralight and AppCore follow the same paradigm when it comes to ownership/destruction:
///  You should explicitly Destroy anything you Create.
///

bool done = false;

/// Forward declaration of our page-settled callback.
void OnPageSettled(void* user_data, ULView caller, ULString url);

/// Forward declaration of our logger callback.
void LogMessage(ULLogLevel log_level, ULString message);

/// Small helper so our own status lines go through the same logger as the library's.
void Log(const char* message);

int main() {
  ///
  /// Setup our config.
  ///
  /// @note:
  ///   We don't set any config options in this sample but you could set your own options here.
  ///
  /// In the C API the config is passed to ulCreateRenderer() below (there is no separate
  /// set-config call like in C++).
  ///
  ULConfig config = ulCreateConfig();

  ///
  /// We must provide our own Platform API handlers since we're not using ulCreateApp().
  ///
  /// The Platform API handlers we can set are:
  ///
  ///  - ulPlatformSetLogger            (empty, optional)
  ///  - ulPlatformSetGPUDriver         (empty, optional)
  ///  - ulPlatformSetFontLoader        (empty, **required**)
  ///  - ulPlatformSetFileSystem        (empty, **required**)
  ///  - ulPlatformSetClipboard         (empty, optional)
  ///  - ulPlatformSetSurfaceDefinition (defaults to a bitmap surface, **required**)
  ///
  /// The only Platform API handlers we are required to provide are file system and font loader.
  ///
  /// In this sample we will use AppCore's font loader and file system via
  /// ulEnablePlatformFontLoader() and ulEnablePlatformFileSystem() respectively.
  ///
  /// You can replace these with your own implementations later.
  ///
  ulEnablePlatformFontLoader();

  ///
  /// Use AppCore's file system singleton to load file:/// URLs from the OS.
  ///
  /// You could replace this with your own to provide your own file loader (useful if you need to
  /// bundle encrypted / compressed HTML assets).
  ///
  ULString base_dir = ulCreateString("./assets/");
  ulEnablePlatformFileSystem(base_dir);
  ulDestroyString(base_dir);

  ///
  /// Register our LogMessage() callback as the logger so we can handle the library's log
  /// messages below in case we encounter an error.
  ///
  ULLogger logger = { LogMessage };
  ulPlatformSetLogger(logger);

  ///
  /// Create our Renderer (you should only create this once per application).
  ///
  /// The Renderer singleton maintains the lifetime of the library and is required before
  /// creating any Views. It should outlive any Views.
  ///
  /// You should set up the Platform handlers before creating this.
  ///
  ULRenderer renderer = ulCreateRenderer(config);

  ///
  /// Done using our config, make sure to destroy anything we create.
  ///
  ulDestroyConfig(config);

  ///
  /// Create our View.
  ///
  /// Views are sized containers for loading and displaying web content.
  ///
  /// Let's set a 2x DPI scale and disable GPU acceleration so we can render to a bitmap.
  ///
  ULViewConfig view_config = ulCreateViewConfig();
  ulViewConfigSetInitialDeviceScale(view_config, 2.0);
  ulViewConfigSetIsAccelerated(view_config, false);

  ULView view = ulCreateView(renderer, 1600, 800, view_config, 0);

  ulDestroyViewConfig(view_config);

  ///
  /// Register OnPageSettled() with our View so we can handle its page-settled event below.
  ///
  ulViewSetPageSettledCallback(view, OnPageSettled, 0, 0);

  ///
  /// Load a local HTML file into the View (uses the file system defined above).
  ///
  /// @note:
  ///   This operation may not complete immediately-- we will run our main loop below and wait
  ///   for the page-settled event before saving our View.
  ///
  /// Views can also load remote URLs, try replacing the code below with:
  ///
  ///   ULString url_string = ulCreateString("https://en.wikipedia.org");
  ///   ulViewLoadURL(view, url_string);
  ///   ulDestroyString(url_string);
  ///
  ULString url_string = ulCreateString("file:///page.html");
  ulViewLoadURL(view, url_string);
  ulDestroyString(url_string);

  Log("Starting Run(), waiting for page to settle...");

  ///
  /// Run our main loop until OnPageSettled() is called below (which sets done = true).
  ///
  /// @note:
  ///   ulUpdate() handles any pending network requests, resource loads, and JavaScript timers.
  ///   ulRefreshDisplay() and ulRender() run the page's rendering updates and paint it to the
  ///   View's surface. A page only settles once it has been painted, so we call all three on
  ///   every pass.
  ///
  /// Some pages never settle (eg, ones with constant network or layout activity), so we also
  /// give up waiting after about 10 seconds (1000 passes) and save whatever has been painted.
  ///
  int passes = 0;
  do {
    ulUpdate(renderer);
    ulRefreshDisplay(renderer, 0);
    ulRender(renderer);
    sleep_ms(10);
  } while (!done && ++passes < 1000);

  ///
  /// Get our View's rendering surface.
  ///
  /// The default Surface implementation is a bitmap surface, you can provide your own via
  /// ulPlatformSetSurfaceDefinition().
  ///
  ULSurface surface = ulViewGetSurface(view);

  ///
  /// Get the underlying bitmap.
  ///
  /// @note  Don't call ulDestroyBitmap() on the returned value, it is owned by the surface.
  ///
  ULBitmap bitmap = ulBitmapSurfaceGetBitmap(surface);

  ///
  /// Write our bitmap to a PNG in the current working directory.
  ///
  ulBitmapWritePNG(bitmap, "result.png");

  Log("Saved a render of our page to result.png.");

  ///
  /// Explicitly destroy everything we created (the View before the Renderer).
  ///
  ulDestroyView(view);
  ulDestroyRenderer(renderer);

  return 0;
}

///
/// This is called once the page has loaded and its layout has gone quiet, so it's ready to
/// capture.
///
/// We wait for this instead of the finish-loading callback: a page can keep loading resources
/// and changing its layout after the load itself finishes.
///
void OnPageSettled(void* user_data, ULView caller, ULString url) {
  Log("Our page has settled!");

  ///
  /// Set our done flag to true to exit the main loop.
  ///
  done = true;
}

///
/// This is called when the library wants to print a message to the log.
///
void LogMessage(ULLogLevel log_level, ULString message) {
  printf("> %s\n\n", ulStringGetData(message));
}

void Log(const char* message) {
  ULString str = ulCreateString(message);
  LogMessage(kLogLevel_Info, str);
  ulDestroyString(str);
}
