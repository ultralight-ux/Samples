#include <AppCore/App.h>
#include <AppCore/Window.h>

using namespace ultralight;

///
/// Welcome to Sample 2!
///
/// In this sample we'll introduce the AppCore API and use it to build a simple application that
/// creates a window and displays a local HTML file.
///
/// __What is AppCore?__
///
/// AppCore is an optional, high-performance, cross-platform application framework built on top of
/// the Ultralight renderer.
///
/// It can be used to create standalone, GPU-accelerated HTML applications that paint directly to
/// the native window's backbuffer using the best technology available on each platform (D3D,
/// Metal, OpenGL, etc.).
///
/// We will create the simplest possible AppCore application in this sample.
///

class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    /// The App class is responsible for the lifetime of the application and is required to create
    /// any windows.
    ///
    app_ = App::Create();

    ///
    /// Create our Window.
    ///
    /// This command creates a native platform window and shows it immediately.
    ///
    /// The window's size (900 by 600) is in DPI-independent logical pixels; the actual size in
    /// pixels is automatically determined by the monitor's DPI.
    ///
    window_ = Window::Create(app_->main_monitor(), 900, 600, false, WindowFlags::Titled);

    ///
    /// Set the title of our window.
    ///
    window_->SetTitle("Ultralight Sample 2 - Basic App");

    ///
    /// Add a web-content panel that spans the entire window.
    ///
    /// Each window has its own layout tree; a bare AddPanel() fills the window and tracks its
    /// size automatically. Each panel has its own View which can be used to load and display
    /// web-content.
    ///
    /// AppCore automatically manages focus, keyboard/mouse input, and GPU painting for each
    /// panel. Removing the panel from the layout tree will remove it from the window.
    ///
    panel_ = window_->AddPanel();

    ///
    /// Load a local HTML file into our panel's View
    ///
    panel_->view()->LoadURL("file:///page.html");

    ///
    /// Register our MyApp instance as a WindowListener so we can handle the Window's OnClose event
    /// below.
    ///
    window_->set_listener(this);
  }

  virtual ~MyApp() {}

  ///
  /// Inherited from WindowListener, called when the Window is closed.
  ///
  /// We exit the application when the window is closed.
  ///
  virtual void OnClose(ultralight::Window* window) override {
    app_->Quit();
  }

  ///
  /// Inherited from WindowListener, called when the Window is resized.
  ///
  /// (Not used in this sample)
  ///
  virtual void OnResize(ultralight::Window* window, double width, double height) override {}

  void Run() {
    app_->Run();
  }
};

int main() {
  MyApp app;
  app.Run();

  return 0;
}
