#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <AppCore/Dialogs.h>
#include <Ultralight/DOM.h>

#include <chrono>
#include <string>

using namespace ultralight;

///
/// Welcome to Sample 10!
///
/// In this sample we'll build a window that looks and feels native while every visible
/// pixel of it is drawn with HTML and CSS.
///
/// Four pieces of the Window API do the work:
///
///  - WindowFlags::CustomChrome removes the system title bar but keeps every native frame
///    behavior: the shadow and rounded corners, the resize edges, snap gestures, and the
///    system window menu. Our page draws the title bar and declares its draggable area
///    with the `app-region` CSS property, so the chrome needs almost no native code.
///  - Window::SetBackdrop() renders a native backdrop material behind our content: the
///    same blurred, theme-aware surface the OS draws for its own windows. The material
///    shows wherever the page is transparent, and where no live material is available the
///    library falls back to a solid theme-derived fill, so this code is safe everywhere.
///  - Window::CreatePopup() gives us a real OS window for the appearance menu: it can
///    extend beyond our bounds, never steals focus, and auto-dismisses like a native menu.
///  - ShowMessageBox() opens the platform's own modal message box.
///
/// The pages adapt to the OS light/dark theme through the `prefers-color-scheme` media
/// query, and the menu can pin a theme instead: we pin the material (BackdropOptions) and
/// the page (View::set_preferred_color_scheme) together so they always agree.
///
/// The chrome pages run no script of their own; dom::Listeners wires their buttons to the
/// native methods below.
///

static constexpr double kMenuWidth = 240;
static constexpr double kMenuHeight = 182;

class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;
  RefPtr<Window> menu_;
  RefPtr<Panel> menu_panel_;

  dom::Listeners chrome_listeners_;
  dom::Listeners menu_listeners_;

  ///
  /// Held page handles: the root elements receive window-state classes and the current
  /// theme choice, and CSS does the rest.
  ///
  dom::Element chrome_root_;
  dom::Element menu_root_;

  bool has_native_controls_ = false;
  bool chrome_applied_ = false;

  ///
  /// Toggle bookkeeping for the menu button: a press on the button while the menu is
  /// open auto-dismisses the menu before the button's click handler runs, so the two
  /// timestamps below let that click be recognized as the toggle's close half.
  ///
  std::chrono::steady_clock::time_point menu_dismissed_at_ {};
  std::chrono::steady_clock::time_point menu_button_pressed_at_ {};
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();

    ///
    /// Create the window with custom chrome. It stays a normal framed window underneath,
    /// so the OS keeps the shadow, resize edges, snap gestures, and window animations.
    ///
    window_ = Window::Create(app_->main_monitor(), 900, 620, false,
        WindowFlags::CustomChrome | WindowFlags::Resizable | WindowFlags::Maximizable);
    window_->SetTitle("Ultralight Sample 10 - Native Look and Feel");
    window_->set_listener(this);

    ///
    /// Request the main-window material. We leave the window background color unset so
    /// the material shows untinted; the page supplies its own translucent surfaces.
    ///
    window_->SetBackdrop(BackdropMaterial::Window);

    ///
    /// The page sits directly on the material, so its View must be transparent. Start
    /// from default_view_config() to keep the window-derived defaults (fonts, scale) and
    /// change only what we need.
    ///
    ViewConfig config = window_->default_view_config();
    config.is_transparent = true;
    panel_ = window_->AddPanel({}, config);

    ///
    /// The appearance menu: a pooled popup, created hidden once and re-shown on demand.
    /// Popups default to Dismiss::Auto, so the library hides it exactly the way the OS
    /// dismisses a native menu (a press outside it, Esc, the owner moving).
    ///
    menu_ = Window::CreatePopup(window_, 0, 0, kMenuWidth, kMenuHeight, WindowFlags::Hidden);
    menu_->set_listener(this);
    menu_->SetBackdrop(BackdropMaterial::Popup);

    ViewConfig menu_config = menu_->default_view_config();
    menu_config.is_transparent = true;
    menu_panel_ = menu_->AddPanel({}, menu_config);

    ///
    /// Wire the chrome page. The caption buttons drive the same methods the system
    /// buttons would, and the menu button measures itself so the popup opens right
    /// underneath it.
    ///
    chrome_listeners_.On("#menu-button", "mousedown", [this] {
      menu_button_pressed_at_ = std::chrono::steady_clock::now();
    });
    chrome_listeners_.On("#menu-button", "click",
                         [this](dom::Element button) { OpenMenu(button); });
    chrome_listeners_.On("#minimize", "click", [this] { window_->Minimize(); });
    chrome_listeners_.On("#maximize", "click", [this] {
      window_->is_maximized() ? window_->Restore() : window_->Maximize();
    });
    chrome_listeners_.On("#close", "click", [this] { window_->Close(); });
    chrome_listeners_.On("#dialog-button", "click", [] {
      ShowMessageBox("Native Look and Feel",
                     "This is the platform's own message box, opened with "
                     "ShowMessageBox(). Everything else you see is HTML.");
    });
    chrome_listeners_.OnDOMReady([this](dom::Document doc) {
      chrome_root_ = doc.documentElement();
      ApplyPlatformChrome();
    });
    if (chrome_listeners_.AttachTo(panel_->view().get()))
      panel_->view()->LoadURL("file:///chrome.html");

    ///
    /// Wire the menu page: three theme choices, the about box, and quit.
    ///
    menu_listeners_.On("[data-scheme]", "click", [this](dom::Element item) {
      SetScheme(std::string(item.dataset["scheme"]));
    });
    menu_listeners_.On("#about", "click", [this] {
      menu_->Hide();
      ShowMessageBox("About This Sample",
                     "A frameless window with HTML chrome over a native backdrop "
                     "material. Drag the title bar, double-click it, snap the window, "
                     "and switch themes from this menu.");
    });
    menu_listeners_.On("#quit", "click", [this] { app_->Quit(); });
    menu_listeners_.OnDOMReady([this](dom::Document doc) {
      menu_root_ = doc.documentElement();
      menu_root_.dataset["scheme"] = "auto";
    });
    if (menu_listeners_.AttachTo(menu_panel_->view().get()))
      menu_panel_->view()->LoadURL("file:///menu.html");
  }

  virtual ~MyApp() {
    chrome_listeners_.DetachFrom(panel_->view().get());
    menu_listeners_.DetachFrom(menu_panel_->view().get());
  }

  ///
  /// Adapt the chrome to the platform's window controls. On macOS the native traffic
  /// lights overlay our content: we position them inside our title bar and tell the page
  /// how much space to leave them. Everywhere else the page shows its own caption
  /// buttons, and we register their footprints as native hit-test regions so the OS
  /// treats them as real window buttons (hover still reaches the page for styling).
  ///
  void ApplyPlatformChrome() {
    has_native_controls_ = !window_->window_control_bounds().IsEmpty();
    if (has_native_controls_) {
      // The platform's leading inset; the y value centers the visible button glyphs in
      // our 46px title bar (their AppKit frames extend past the glyphs, so a frame-top
      // inset of half the leftover bar height would sit them low). The page is told how
      // much space to leave them.
      window_->SetWindowControlInset(20, 14.5);
      Rect controls = window_->window_control_bounds();
      chrome_root_.classList.add("native-controls");
      chrome_root_.style.setProperty("--controls-clearance",
                                     std::to_string((int)controls.right + 12) + "px");
      window_->SetHitTestRegions(nullptr, 0);
    } else {
      chrome_root_.classList.add("app-controls");
      UpdateHitTestRegions();
    }
    chrome_applied_ = true;
  }

  ///
  /// The caption-button band hugs the window's top-right corner, so its regions must be
  /// re-declared whenever the width changes. The draggable strip needs no region at all:
  /// the page declares it with `app-region: drag`.
  ///
  void UpdateHitTestRegions() {
    double width = window_->width();
    HitTestRegion regions[] = {
      { HitRegionRole::Minimize, Rect::FromXYWH((float)width - 138, 0, 46, 46) },
      { HitRegionRole::Maximize, Rect::FromXYWH((float)width - 92, 0, 46, 46) },
      { HitRegionRole::Close,    Rect::FromXYWH((float)width - 46, 0, 46, 46) },
    };
    window_->SetHitTestRegions(regions, 3);
  }

  ///
  /// Open the appearance menu right under its button. Popup coordinates are relative to
  /// the owner's content area, which is exactly what getBoundingClientRect() measures, so
  /// no conversion is needed.
  ///
  void OpenMenu(dom::Element button) {
    // If this same press already auto-dismissed the open menu, the click is the close
    // half of a toggle: swallow it instead of reopening.
    auto press_to_dismiss = menu_button_pressed_at_ - menu_dismissed_at_;
    if (press_to_dismiss > std::chrono::milliseconds(-150)
        && press_to_dismiss < std::chrono::milliseconds(150))
      return;

    dom::DOMRect rect = button.getBoundingClientRect();
    menu_->MoveTo(rect.x + rect.width - kMenuWidth, rect.bottom() + 6);
    menu_->Show();
  }

  ///
  /// Pin or unpin the theme. The material and the page each have their own theme
  /// control; setting both from one place keeps the glass and the content in agreement.
  ///
  void SetScheme(const std::string& name) {
    ColorScheme scheme = name == "light" ? ColorScheme::Light
                       : name == "dark"  ? ColorScheme::Dark
                                         : ColorScheme::Auto;
    BackdropTheme theme = name == "light" ? BackdropTheme::Light
                        : name == "dark"  ? BackdropTheme::Dark
                                          : BackdropTheme::Auto;

    window_->SetBackdrop(BackdropMaterial::Window, { .theme = theme });
    menu_->SetBackdrop(BackdropMaterial::Popup, { .theme = theme });
    panel_->view()->set_preferred_color_scheme(scheme);
    menu_panel_->view()->set_preferred_color_scheme(scheme);

    menu_root_.dataset["scheme"] = name.c_str();
    menu_->Hide();
  }

  ///
  /// Restyle the chrome as the window's state changes: CSS keys off the classes we set
  /// on the page's root element.
  ///
  virtual void OnWindowStateChanged(ultralight::Window* window, WindowState state) override {
    if (window == window_.get())
      chrome_root_.classList.toggle("is-maximized", state == WindowState::Maximized);
  }

  ///
  /// Inherited from WindowListener, called when the library auto-dismisses the menu
  /// (a press outside it, Esc, the window moving). Recorded for the toggle above.
  ///
  virtual void OnDismiss(ultralight::Window* window) override {
    if (window == menu_.get())
      menu_dismissed_at_ = std::chrono::steady_clock::now();
  }

  virtual void OnActivationChanged(ultralight::Window* window, bool active) override {
    if (window == window_.get())
      chrome_root_.classList.toggle("is-inactive", !active);
  }

  ///
  /// Resizes before the chrome page is ready must not register regions: the platform
  /// decision has not been made yet, and stale Windows-style button regions on macOS
  /// would swallow clicks at the window's top-right corner.
  ///
  virtual void OnResize(ultralight::Window* window, double width, double height) override {
    if (window == window_.get() && chrome_applied_ && !has_native_controls_)
      UpdateHitTestRegions();
  }

  ///
  /// Inherited from WindowListener, called when the Window is closed. The menu is owned
  /// by the main window and dies with it, so only the main window's close quits.
  ///
  virtual void OnClose(ultralight::Window* window) override {
    if (window == window_.get())
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
