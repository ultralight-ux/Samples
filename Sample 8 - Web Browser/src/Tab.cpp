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
}

void Tab::Hide() {
  container_->Hide();
}

void Tab::ToggleInspector() {
  if (!inspector_panel_) {
    view()->CreateLocalInspectorView();
  } else if (inspector_panel_->is_hidden()) {
    inspector_panel_->Show();
  } else {
    inspector_panel_->Hide();
  }
}

void Tab::OnChangeTitle(View* caller, const String& title) {
  ui_->UpdateTabTitle(id_, title);
}

void Tab::OnChangeURL(View* caller, const String& url) {
  ui_->UpdateTabURL(id_, url);
}

void Tab::OnChangeTooltip(View* caller, const String& tooltip) {}

void Tab::OnChangeCursor(View* caller, Cursor cursor) {
  if (id_ == ui_->active_tab_id_)
    ui_->SetCursor(cursor);
}

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
    sprintf(error_code_str,"%d", error_code);

    String html_string = "<html><head><style>";
    html_string += "* { font-family: sans-serif; }";
    html_string += "body { background-color: #CCC; color: #555; padding: 4em; }";
    html_string += "dt { font-weight: bold; padding: 1em; }";
    html_string += "</style></head><body>";
    html_string += "<h2>A Network Error was Encountered</h2>";
    html_string += "<dl>";
    html_string += "<dt>URL</dt><dd>" + url + "</dd>";
    html_string += "<dt>Description</dt><dd>" + description + "</dd>";
    html_string += "<dt>Error Domain</dt><dd>" + error_domain + "</dd>";
    html_string += "<dt>Error Code</dt><dd>" + String(error_code_str) + "</dd>";
    html_string += "</dl></body></html>";

    view()->LoadHTML(html_string);
  }
}

void Tab::OnUpdateHistory(View* caller) {
  ui_->UpdateTabNavigation(id_, caller->is_loading(), caller->CanGoBack(), caller->CanGoForward());
}
