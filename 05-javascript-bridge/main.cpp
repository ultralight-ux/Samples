#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <Ultralight/JS.h>

#include <chrono>
#include <string>

using namespace ultralight;

///
/// Welcome to Sample 5!
///
/// In this sample we'll connect page JavaScript to native C++ with the js:: bridge, and let
/// the page measure the bridge itself.
///
/// You start by declaring a js::API rooted at a global namespace (eg, `app`), and then bind
/// functions, events, and constants to it. The page can then call those functions, subscribe
/// to events, and read the data from JavaScript. The library handles type conversions and
/// lifetime management automatically for you.
///
/// The js::API bindings survive navigation, so you can load a new page and the bindings
/// will still be there (as long as it matches the origin rules).
///
/// The page cannot modify the js::API namespace itself (it is frozen, native-code owns it).
///
/// Three things cross the bridge here:
///
///  - `app.ping()` is a typed function: the page calls it with a string and gets a string
///    back from C++.
///  - `app.increment()` is the benchmark target, a call small enough that what the page
///    times in a tight loop is the bridge round trip itself.
///  - `app.tick` is an event we emit from native code once a second; events are
///    fire-and-forget pushes, and the page just subscribes.
///
/// The HTML/JavaScript side of this sample lives in assets/app.html.
///

class MyApp : public AppListener,
              public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;

  ///
  /// The binding registry, bound to the `app` namespace in JavaScript.
  ///
  js::API api_ { "app" };

  std::chrono::steady_clock::time_point start_ = std::chrono::steady_clock::now();
  std::chrono::steady_clock::time_point last_tick_ = start_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();
    app_->set_listener(this);

    ///
    /// Create our Window.
    ///
    window_ = Window::Create(app_->main_monitor(), 520, 560, false, WindowFlags::Titled);
    window_->SetTitle("Ultralight Sample 5 - JavaScript Bridge");
    window_->set_listener(this);

    ///
    /// Add a web-content panel that spans the entire window.
    ///
    panel_ = window_->AddPanel();

    ///
    /// A constant: exposed to the page as `app.version`.
    ///
    api_["version"] = "2.0.0";

    ///
    /// Bind `app.ping()` to a C++ lambda.
    ///
    /// Functions are strongly-typed in the bridge: the library will attempt to marshal arguments
    /// and return values to the declared C++ types and a mismatched call becomes a
    /// TypeError on the page instead of ever reaching this lambda.
    ///
    /// The `js::Param` type is optional but it lets you declare parameter names for diagnostic
    /// purposes (eg, for debugging and documentation).
    ///
    api_.Bind("ping", [](std::string message) {
      return std::string("pong: ") + message;
    }, js::Param("message"));

    ///
    /// Bind `app.increment()` to a C++ lambda.
    ///
    api_.Bind("increment", [](double value) {
      return value + 1.0;
    }, js::Param("value"));

    ///
    /// Declare the event we emit below so it is part of the registry's schema (a typo'd
    /// page subscription can then warn in development builds).
    ///
    api_.DefineEvent<double>("tick", js::Param("uptime"));

    ///
    /// Attach the "app" js::API bindings to our View before loading any content.
    ///
    /// By default, only local pages (`file://`) and HTML you load directly will have access
    /// to the js::API object unless you override the origin rules.
    ///
    if (api_.AttachTo(panel_->view().get()))
      panel_->view()->LoadURL("file:///app.html");
  }

  virtual ~MyApp() {}

  ///
  /// Inherited from AppListener, called continuously by the app's run loop. Once a second
  /// we push the app's uptime across the bridge; the page subscribes with
  /// `app.on('tick', ...)`. Emit() is safe to call from any thread.
  ///
  virtual void OnUpdate() override {
    using namespace std::chrono;
    auto now = steady_clock::now();
    if (now - last_tick_ < seconds(1))
      return;
    last_tick_ = now;
    api_.Emit("tick", duration<double>(now - start_).count());
  }

  ///
  /// Inherited from WindowListener, called when the Window is closed.
  ///
  virtual void OnClose(ultralight::Window* window) override {
    app_->Quit();
  }

  void Run() {
    app_->Run();
  }
};

int main() {
  MyApp app;
  app.Run();

  return 0;
}
