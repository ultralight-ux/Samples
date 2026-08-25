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
  window_ = Window::Create(app_->main_monitor(), 1024, 768, false,
    WindowFlags::CustomChrome | WindowFlags::Resizable | WindowFlags::Maximizable);
  window_->SetTitle("Ultralight Sample 12 - Web Browser");
  window_->SetBackdrop(BackdropMaterial::Window);

  // Create the UI
  ui_.reset(new UI(window_));
  window_->set_listener(ui_.get());
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
