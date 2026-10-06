#include <AppCore/App.h>
#include <AppCore/Monitor.h>
#include <AppCore/Window.h>
#include <algorithm>

using namespace ultralight;

///
/// Welcome to Sample 13!
///
/// This sample is a small gallery of game interfaces: a racing HUD, a flight HUD, heist and
/// dark-fantasy menus, an ink-painted duel, and a cozy tidepool game. Each one is a fictional
/// game's screen built with HTML, CSS, SVG, and canvas, animated live, and drawn by Ultralight's
/// GPU renderer.
///
/// __How it fits together__
///
/// The native side is as small as Sample 2: one window with one panel. Everything else lives in
/// the `assets/` folder:
///
///  - `index.html` is the chooser. Clicking a card (or pressing Enter) navigates the same View to
///    that scene's page.
///  - `scenes/<name>/index.html` is one scene. Each scene loads `scenes/_harness/scene.js`, which
///    runs its animation loop and handles the way back: pressing Esc (or clicking the Back
///    control) navigates to the chooser again.
///
/// Since navigation is ordinary page navigation, you can also open any of these pages in
/// MiniBrowser or your own application.
///

class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;
public:
  MyApp() {
    app_ = App::Create();

    ///
    /// Size the window for 16:9 content: 1600 by 900 logical pixels, scaled down to fit within
    /// 80% of the main monitor.
    ///
    /// Monitor and window sizes are in DPI-independent logical pixels, so the same numbers work at
    /// any display scale.
    ///
    Monitor* monitor = app_->main_monitor();
    double scale = std::min({ 1.0, monitor->width() * 0.8 / 1600.0,
                              monitor->height() * 0.8 / 900.0 });

    window_ = Window::Create(monitor, 1600 * scale, 900 * scale, false,
        WindowFlags::Titled | WindowFlags::Resizable | WindowFlags::Maximizable |
        WindowFlags::Hidden);
    window_->SetTitle("Ultralight Sample 13 - Game UI");
    window_->MoveToCenter();
    window_->set_listener(this);

    ///
    /// One panel fills the window. Its View shows the chooser first and then each scene the user
    /// opens; the pages handle all navigation themselves.
    ///
    panel_ = window_->AddPanel();
    panel_->view()->LoadURL("file:///index.html");

    ///
    /// Show the window once the chooser has loaded and settled, so the first frame on screen is
    /// the finished page.
    ///
    window_->ShowWhenReady();
  }

  virtual ~MyApp() {}

  ///
  /// Inherited from WindowListener, called when the Window is closed.
  ///
  /// We exit the application when the window is closed.
  ///
  virtual void OnClose(ultralight::Window*) override {
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
