#include <AppCore/App.h>
#include <AppCore/Window.h>

using namespace ultralight;

///
/// Welcome to Sample 3!
///
/// In this sample we'll continue working with the AppCore API and use the window's layout tree
/// to build a multi-pane application that responds to changes in window size automatically.
///
/// We will split the window into two panels-- a left pane with a fixed width and a right pane
/// that takes up the remaining width.
///
///    +----------------------------------------------------+
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    |   Left Pane   |             Right Pane             |
///    |    (200px)    |              (Fluid)               |
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    |               |                                    |
///    +----------------------------------------------------+
///
/// Panels declare their sizes in CSS-style units and the window re-resolves the layout whenever
/// it is resized or moved to a monitor with a different DPI-- there is no resize math to write.
///
/// We'll also mark the split resizable, which puts a draggable divider between the two panes.
///

class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> left_pane_;
  RefPtr<Panel> right_pane_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();

    ///
    /// Create a resizable window by passing by OR'ing our window flags with
    /// WindowFlags::Resizable.
    ///
    window_ = Window::Create(app_->main_monitor(), 900, 600, false,
        WindowFlags::Titled | WindowFlags::Resizable);

    ///
    /// Set the title of our window.
    ///
    window_->SetTitle("Ultralight Sample 3 - Resize Me!");

    ///
    /// Split the window with a resizable row: a fixed-width sidebar and a fluid content pane.
    ///
    /// A panel with no declared size takes one flex share of the free space, so the right pane
    /// fills whatever the sidebar leaves. The `min_size` constraint keeps the sidebar usable
    /// when the user drags the divider between the panes.
    ///
    RefPtr<Container> split = window_->layout()->AddRow({ .resizable = true });
    left_pane_ = split->AddPanel({ .key = "sidebar", .size = "200px", .min_size = "100px" });
    right_pane_ = split->AddPanel({ .key = "content" });

    ///
    /// Load some HTML into our left and right panes.
    ///
    left_pane_->view()->LoadURL("file:///sidebar.html");
    right_pane_->view()->LoadURL("file:///content.html");

    ///
    /// Register our MyApp instance as a WindowListener so we can handle the Window's OnClose
    /// event below.
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

  void Run() {
    app_->Run();
  }
};

int main() {
  MyApp app;
  app.Run();

  return 0;
}
