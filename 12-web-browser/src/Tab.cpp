#include "Tab.h"
#include "UI.h"
#include <iostream>
#include <string>

Tab::Tab(UI* ui, uint64_t id, bool hidden)
  : ui_(ui), id_(id) {
  ///
  /// Each tab is a column beneath the UI strip: the page content panel, plus an inspector
  /// panel when the inspector is open. Marking the column resizable lets the user drag the
  /// divider between page and inspector. Only the active tab's column is shown.
  ///
  container_ = ui->window()->layout()->AddColumn({ .resizable = true, .hidden = hidden });
  panel_ = container_->AddPanel();
  view()->set_view_listener(this);
  view()->set_load_listener(this);

  ///
  /// A tab opened in the background starts paused (see Hide for what pausing covers);
  /// its page still loads while hidden.
  ///
  if (hidden)
    view()->set_visible(false);
}

Tab::~Tab() {
  RefPtr<View> content_view = panel_->view();
  if (content_view) {
    content_view->set_view_listener(nullptr);
    content_view->set_load_listener(nullptr);
  }

  // Handles are identity, not lifetime: dropping them would leave the tab's column in the
  // window's layout, so remove it explicitly (a benign no-op after the window closes).
  ui_->window()->layout()->Remove(container_);
}

void Tab::Show() {
  container_->Show();
  panel_->Focus();
  view()->set_visible(true);
  if (inspector_panel_ && !inspector_panel_->is_hidden())
    inspector_panel_->view()->set_visible(true);
}

///
/// Hiding the column takes the tab's panels out of the layout; pausing each View stops
/// its rendering work too. A hidden View is skipped by Renderer::Render and suspends
/// requestAnimationFrame and CSS animations, and the page sees a `visibilitychange`,
/// so background tabs spend no time rendering. (JavaScript timers keep ticking so
/// background logic continues; see ViewConfig::enable_hidden_timer_throttling.)
///
void Tab::Hide() {
  container_->Hide();
  view()->set_visible(false);
  if (inspector_panel_)
    inspector_panel_->view()->set_visible(false);
}

void Tab::ToggleInspector() {
  if (!inspector_panel_) {
    view()->CreateLocalInspectorView();
  } else if (inspector_panel_->is_hidden()) {
    inspector_panel_->Show();
    inspector_panel_->view()->set_visible(true);
  } else {
    inspector_panel_->Hide();
    inspector_panel_->view()->set_visible(false);
  }
}

void Tab::OnChangeTitle(View* caller, const String& title) {
  ui_->UpdateTabTitle(id_, title);
}

void Tab::OnChangeURL(View* caller, const String& url) {
  ui_->UpdateTabURL(id_, url);
}

void Tab::OnChangeTooltip(View* caller, const String& tooltip) {}

void Tab::OnAddConsoleMessage(View* caller, const ConsoleMessage& msg) {
}

RefPtr<View> Tab::OnCreateChildView(ultralight::View* caller,
  const String& opener_url, const String& target_url,
  bool is_popup, const IntRect& popup_rect) {
  return ui_->CreateNewTabForChildView(target_url);
}

RefPtr<View> Tab::OnCreateInspectorView(ultralight::View* caller, bool is_local,
                                         const String& inspected_url) {
  if (inspector_panel_)
    return nullptr;

  ///
  /// Dock the inspector under the page as a second panel in this tab's resizable column;
  /// the engine provides the divider between them.
  ///
  inspector_panel_ = container_->AddPanel({ .size = "50%" });

  return inspector_panel_->view();
}

void Tab::OnBeginLoading(View* caller, uint64_t frame_id, bool is_main_frame, const String& url) {
  ui_->UpdateTabNavigation(id_, caller->is_loading(), caller->CanGoBack(), caller->CanGoForward());
}

void Tab::OnFinishLoading(View* caller, uint64_t frame_id, bool is_main_frame, const String& url) {
  ui_->UpdateTabNavigation(id_, caller->is_loading(), caller->CanGoBack(), caller->CanGoForward());
}

void Tab::OnFailLoading(View* caller, uint64_t frame_id, bool is_main_frame, const String& url,
  const String& description, const String& error_domain, int error_code) {
  if (is_main_frame) {
    char error_code_str[16];
    snprintf(error_code_str, sizeof(error_code_str), "%d", error_code);

    String html_string = "<!DOCTYPE html><html><head><style>"
        ":root { --bg: #eef0f5; --panel: #ffffff; --text: #1b2030; --muted: #6b7186;"
        " --border: #e1e4ec; }"
        "@media (prefers-color-scheme: dark) { :root { --bg: #0f1117; --panel: #171a23;"
        " --text: #e6e8ef; --muted: #8b91a6; --border: #2a2f40; } }"
        "html, body { margin: 0; height: 100%; }"
        "body { display: flex; align-items: center; justify-content: center;"
        " background: var(--bg); color: var(--text); font-family: sans-serif;"
        " font-size: 13px; line-height: 1.4; }"
        ".card { width: 420px; padding: 32px; background: var(--panel);"
        " border: 1px solid var(--border); border-radius: 12px; }"
        "h1 { margin: 0 0 12px; font-size: 22px; letter-spacing: -0.02em; }"
        "dt { font-weight: 600; margin-top: 12px; }"
        "dd { margin: 2px 0 0; color: var(--muted); word-break: break-all; }"
        "</style></head><body><div class=\"card\">"
        "<h1>This page failed to load.</h1><dl>";
    html_string += "<dt>URL</dt><dd>" + url + "</dd>";
    html_string += "<dt>Description</dt><dd>" + description + "</dd>";
    html_string += "<dt>Error</dt><dd>" + error_domain + " (" + String(error_code_str) + ")</dd>";
    html_string += "</dl></div></body></html>";

    view()->LoadHTML(html_string);
  }
}

void Tab::OnUpdateHistory(View* caller) {
  ui_->UpdateTabNavigation(id_, caller->is_loading(), caller->CanGoBack(), caller->CanGoForward());
}
