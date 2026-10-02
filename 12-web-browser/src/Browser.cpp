#include "Browser.h"

Browser::Browser()  {
  Settings settings;
  Config config;
  app_ = App::Create(settings, config);

  ///
  /// The browser draws its own chrome: WindowFlags::CustomChrome removes the system title
  /// bar while the OS keeps every frame behavior (shadow, resize edges, snap gestures).
  /// The chrome strip sits on the window's backdrop material, requested here; where no
  /// live material is available the library falls back to a solid theme-derived fill.
  ///
  /// The window starts hidden until the chrome and the first tab are ready (see
  /// ShowWhenReady() below).
  ///
  window_ = Window::Create(app_->main_monitor(), 1024, 768, false,
    WindowFlags::CustomChrome | WindowFlags::Resizable | WindowFlags::Maximizable |
    WindowFlags::Hidden);
  window_->SetTitle("Ultralight Sample 12 - Web Browser");
  window_->SetBackdrop(BackdropMaterial::Window);

  // Create the UI
  ui_.reset(new UI(window_));
  window_->set_listener(ui_.get());

  ///
  /// Show the window once its pages have loaded and settled. The chrome page opens the
  /// first tab from its DOM-ready handler, so the wait covers the new-tab page too.
  ///
  window_->ShowWhenReady();
}

Browser::~Browser() {
  window_->set_listener(nullptr);

  ui_.reset();

  window_ = nullptr;
  app_ = nullptr;
}

void Browser::Run() {
  app_->Run();
}
