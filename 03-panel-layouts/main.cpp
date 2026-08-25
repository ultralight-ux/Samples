#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <Ultralight/KeyCodes.h>

using namespace ultralight;

///
/// Welcome to Sample 3!
///
/// In this sample we'll use the window's layout tree to build a multi-pane application that
/// responds to changes in window size automatically.
///
/// Every window owns a tree of panels (leaves that display web content) and containers (rows and
/// columns that arrange their children). We'll describe this tree with the layout builder:
///
///    +--------------------------------------------------+
///    | toolbar (fixed height)                           |
///    +-----------+--------------------------------------+
///    |           |                                      |
///    | sidebar   |              content                 |
///    | (240px)   |               (flex)                 |
///    |           |                                      |
///    |           |                      +------------+  |
///    |           |                      |   status   |  |
///    +-----------+----------------------+------------+--+
///
/// The window manages placement, sizing, DPI, input routing, and painting for every panel; there
/// is no resize handling to write. We'll also let the user resize the split by dragging the
/// divider between the two panes, toggle the sidebar with a key, and float a small status panel
/// anchored to a corner.
///
class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> toolbar_;
  RefPtr<Panel> sidebar_;
  RefPtr<Panel> content_;
  RefPtr<Panel> status_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();

    ///
    /// Create our Window.
    ///
    window_ = Window::Create(app_->main_monitor(), 900, 600, false,
                             WindowFlags::Titled | WindowFlags::Resizable);
    window_->SetTitle("Ultralight Sample 3 - Panel Layouts");
    window_->set_listener(this);

    ///
    /// Describe the tiled part of the tree as one builder expression.
    ///
    /// The panel(), row(), and column() elements are sugar over the ordinary AddPanel() /
    /// AddRow() / AddColumn() calls; the out-pointers capture each created handle as the tree
    /// builds.
    ///
    /// Sizes are CSS-style literals: `44px` is a fixed track, `240px` with a `160px` minimum
    /// is a resizable track with a floor, and an unset size means one flex share of whatever
    /// space is left. Marking the row `resizable` puts a draggable divider between its
    /// children.
    ///
    window_->BuildLayout({},
      panel({ .key = "toolbar", .size = "44px", .fixed = true }, &toolbar_),
      row({ .key = "body", .resizable = true, .gap = "1px" },
        panel({ .key = "sidebar", .size = "240px", .min_size = "160px" }, &sidebar_),
        panel({ .key = "content", .min_size = "320px" }, &content_)));

    ///
    /// Style the divider so the drag affordance matches our content's colors. The pages
    /// follow the OS light/dark theme, so the resting line is an opaque slate that reads
    /// on either ground (a translucent color would blend with the window background
    /// behind the gap instead of the panes beside it). Fields left unset fall back to the
    /// built-in defaults; Container::SetDividerStyle can override per container.
    ///
    window_->SetDividerStyle({ .visual_thickness = 1, .color = "#565b68",
                               .hover_color = "#4f8cff" });

    ///
    /// Float a small status panel above the tiled tree, snapped to the window's bottom-right
    /// corner. Anchored placements follow the window as it resizes.
    ///
    /// FocusPolicy::None keeps the keyboard away from it (it behaves like a HUD or toast).
    ///
    status_ = window_->foreground()->AddPanel({
        .key = "status", .width = "280px", .height = "72px",
        .placement = Anchor::WindowCorner(AnchorCorner::BottomRight).Offset(-16, -16),
        .focus = FocusPolicy::None });

    ///
    /// Load each panel's page (all four use the file system defined by App's Settings).
    ///
    toolbar_->view()->LoadURL("file:///toolbar.html");
    sidebar_->view()->LoadURL("file:///sidebar.html");
    content_->view()->LoadURL("file:///content.html");
    status_->view()->LoadURL("file:///status.html");
  }

  virtual ~MyApp() {}

  ///
  /// Inherited from WindowListener, called when the Window is closed.
  ///
  virtual void OnClose(ultralight::Window* window) override {
    app_->Quit();
  }

  ///
  /// Inherited from WindowListener, called before input is routed to the layout tree.
  ///
  /// Pressing B toggles the sidebar. A hidden panel keeps its declared size and shows again
  /// without a layout flash; the flex content pane absorbs the difference automatically.
  ///
  virtual bool OnKeyEvent(ultralight::Window* window,
                          const ultralight::KeyEvent& evt) override {
    if (evt.type == KeyEvent::kType_RawKeyDown && evt.virtual_key_code == KeyCodes::GK_B) {
      if (sidebar_->is_hidden())
        sidebar_->Show();
      else
        sidebar_->Hide();
      return false;
    }

    return true;
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
