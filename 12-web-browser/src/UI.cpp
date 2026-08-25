#include "UI.h"
#include <Ultralight/URL.h>
#include <cstdlib>
#include <string>

///
/// Turns address-bar input into a loadable URL: pass known schemes through as parsed, try
/// an http:// prefix for host-shaped input, and fall back to a web search otherwise.
///
static String NormalizeAddressInput(const String& input) {
  URL typed { input };
  if (typed) {
    String scheme = typed.scheme();
    if (scheme == "http" || scheme == "https" || scheme == "file" || scheme == "inspector"
        || scheme == "about" || scheme == "data")
      return typed;
  }

  // Host-shaped input: an IP, localhost, or a dotted name. Free text (spaces, no dot)
  // never parses as a host, so it falls through to the search arm.
  URL with_http { String("http://") + input };
  if (with_http) {
    std::string host(with_http.host().utf8().data(), with_http.host().utf8().length());
    if (host == "localhost" || host.find('.') != std::string::npos)
      return with_http;
  }

  URL search { "https://www.google.com/search" };
  search.AppendQueryParameter("q", input);
  return search;
}

static uint64_t TabIdFrom(dom::Element element) {
  return strtoull(std::string(element.dataset["id"]).c_str(), nullptr, 10);
}

UI::UI(RefPtr<Window> window) : window_(window) {
  ///
  /// The chrome strip sits on the window's backdrop material, so its View is transparent.
  /// Start from default_view_config() to keep the window-derived defaults and change only
  /// that. Each Tab adds its own opaque pane beneath the strip.
  ///
  ViewConfig config = window_->default_view_config();
  config.is_transparent = true;
  panel_ = window_->AddPanel({ .key = "ui", .size = "84px" }, config);

  ///
  /// Wire the chrome by selector. The tab strip delegates one click handler to every
  /// current and future `.tab` element; the handler reads which tab (and whether its
  /// close glyph) was hit.
  ///
  listeners_.On("#back", "click", *this, &UI::OnBack);
  listeners_.On("#forward", "click", *this, &UI::OnForward);
  listeners_.On("#refresh", "click", *this, &UI::OnRefresh);
  listeners_.On("#stop", "click", *this, &UI::OnStop);
  listeners_.On("#tools", "click", *this, &UI::OnToggleTools);
  listeners_.On("#new-tab", "click", *this, &UI::CreateNewTab);
  listeners_.On(".tab", "click", [this](dom::Event e, dom::Element tab) {
    uint64_t id = TabIdFrom(tab);
    if (e.target().classList.contains("tab-close"))
      CloseTab(id);
    else
      ActivateTab(id);
  });
  listeners_.On("#address", "keydown", [this](dom::Event e, dom::Element) {
    if (e.AsKeyboard().key() == "Enter")
      NavigateToAddressInput();
  });

  // Select-all on the click that gives the address field focus (and only that one), the
  // way desktop browsers behave: focusin arms it, the next mouseup performs it.
  listeners_.On("#address", "focusin", [this] {
    address_focused_ = true;
    select_address_on_mouseup_ = true;
  });
  listeners_.On("#address", "focusout", [this] {
    address_focused_ = false;
    select_address_on_mouseup_ = false;
  });
  listeners_.On("#address", "mouseup", [this](dom::Element address) {
    if (select_address_on_mouseup_)
      address.AsInput().select();
    select_address_on_mouseup_ = false;
  });

  listeners_.OnDOMReady([this](dom::Document doc) {
    doc_ = doc;
    root_ = doc.documentElement();
    tab_strip_ = doc.getElementById("tabs");
    address_ = doc.getElementById("address");
    back_button_ = doc.getElementById("back");
    forward_button_ = doc.getElementById("forward");
    refresh_button_ = doc.getElementById("refresh");
    stop_button_ = doc.getElementById("stop");
    ApplyPlatformChrome();
    CreateNewTab();
  });

  if (listeners_.AttachTo(view().get()))
    view()->LoadURL("file:///ui.html");
}

UI::~UI() {
  listeners_.DetachFrom(view().get());
}

void UI::OnClose(ultralight::Window* window) {
  App::instance()->Quit();
}

///
/// Resizes before the chrome page is ready must not register regions: the platform
/// decision has not been made yet, and stale Windows-style button regions on macOS would
/// swallow clicks at the window's top-right corner.
///
void UI::OnResize(ultralight::Window* window, double width, double height) {
  if (chrome_applied_ && !has_native_controls_)
    UpdateHitTestRegions();
}

///
/// Restyle the chrome as the window's state changes: CSS keys off classes on the chrome
/// page's root element.
///
void UI::OnWindowStateChanged(ultralight::Window* window, WindowState state) {
  root_.classList.toggle("is-maximized", state == WindowState::Maximized);
}

void UI::OnActivationChanged(ultralight::Window* window, bool active) {
  root_.classList.toggle("is-inactive", !active);
}

void UI::OnBack() {
  if (active_tab())
    active_tab()->view()->GoBack();
}

void UI::OnForward() {
  if (active_tab())
    active_tab()->view()->GoForward();
}

void UI::OnRefresh() {
  if (active_tab())
    active_tab()->view()->Reload();
}

void UI::OnStop() {
  if (active_tab())
    active_tab()->view()->Stop();
}

void UI::OnToggleTools() {
  if (active_tab())
    active_tab()->ToggleInspector();
}

void UI::NavigateToAddressInput() {
  std::string input = std::string(address_.value);
  address_.blur();
  if (input.empty() || !active_tab())
    return;
  active_tab()->view()->LoadURL(NormalizeAddressInput(input.c_str()));
}

void UI::CreateNewTab() {
  uint64_t id = tab_id_counter_++;
  tabs_[id].reset(new Tab(this, id, /*hidden=*/!tabs_.empty()));
  tabs_[id]->view()->LoadURL("file:///new_tab_page.html");

  AddTabElement(id, "New Tab");
  ActivateTab(id);
}

///
/// A page asked for a new window (window.open, target=_blank): give it a background tab
/// and return the tab's View for the engine to load into.
///
RefPtr<View> UI::CreateNewTabForChildView(const String& url) {
  uint64_t id = tab_id_counter_++;
  tabs_[id].reset(new Tab(this, id, /*hidden=*/!tabs_.empty()));

  AddTabElement(id, url.empty() ? String("New Tab") : url);
  if (active_tab_id_ == kNoTab)
    ActivateTab(id);

  return tabs_[id]->view();
}

void UI::ActivateTab(uint64_t id) {
  if (id == active_tab_id_ || !tabs_.count(id))
    return;

  if (Tab* current = active_tab())
    current->Hide();

  active_tab_id_ = id;
  tabs_[id]->Show();
  SetActiveTabElement(id);
  RefreshToolbarState();
}

void UI::CloseTab(uint64_t id) {
  if (!tabs_.count(id))
    return;

  // Closing the last tab closes the browser, like the real ones.
  if (tabs_.size() == 1) {
    App::instance()->Quit();
    return;
  }

  bool was_active = (id == active_tab_id_);
  uint64_t neighbor = kNoTab;
  if (was_active) {
    auto it = tabs_.find(id);
    auto next = std::next(it);
    neighbor = (next != tabs_.end()) ? next->first : std::prev(it)->first;
  }

  RemoveTabElement(id);
  tabs_.erase(id);

  if (was_active) {
    active_tab_id_ = kNoTab;
    ActivateTab(neighbor);
  }
}

void UI::UpdateTabTitle(uint64_t id, const String& title) {
  auto it = tab_elements_.find(id);
  if (it != tab_elements_.end())
    it->second.title.textContent = title.utf8().data();
}

void UI::UpdateTabURL(uint64_t id, const String& url) {
  if (id == active_tab_id_)
    SetURL(url);
}

void UI::UpdateTabNavigation(uint64_t id, bool is_loading, bool can_go_back,
                             bool can_go_forward) {
  auto it = tab_elements_.find(id);
  if (it != tab_elements_.end())
    it->second.tab.classList.toggle("loading", is_loading);

  if (id == active_tab_id_) {
    SetLoading(is_loading);
    SetCanGoBack(can_go_back);
    SetCanGoForward(can_go_forward);
  }
}

///
/// The strip's elements are plain DOM built here: a labeled card with a close glyph, keyed
/// by tab id through a data attribute (the click handler reads it back).
///
void UI::AddTabElement(uint64_t id, const String& title) {
  dom::Element tab = doc_.createElement("div");
  tab.classList.add("tab");
  tab.dataset["id"] = std::to_string(id).c_str();

  dom::Element label = doc_.createElement("span");
  label.classList.add("tab-title");
  label.textContent = title.utf8().data();

  dom::Element close = doc_.createElement("span");
  close.classList.add("tab-close");

  // The appends can only fail once the page is gone; their results are discarded.
  (void)tab.appendChild(label);
  (void)tab.appendChild(close);
  (void)tab_strip_.appendChild(tab);

  tab_elements_[id] = { tab, label };
}

void UI::RemoveTabElement(uint64_t id) {
  auto it = tab_elements_.find(id);
  if (it == tab_elements_.end())
    return;
  it->second.tab.remove();
  tab_elements_.erase(it);
}

void UI::SetActiveTabElement(uint64_t id) {
  for (auto& [tab_id, elements] : tab_elements_)
    elements.tab.classList.toggle("active", tab_id == id);
}

void UI::RefreshToolbarState() {
  if (Tab* tab = active_tab()) {
    RefPtr<View> tab_view = tab->view();
    SetLoading(tab_view->is_loading());
    SetCanGoBack(tab_view->CanGoBack());
    SetCanGoForward(tab_view->CanGoForward());
    SetURL(tab_view->url());
  }
}

void UI::SetLoading(bool is_loading) {
  if (is_loading) {
    refresh_button_.style.display = "none";
    stop_button_.style.display = "flex";
  } else {
    refresh_button_.style.display = "flex";
    stop_button_.style.display = "none";
  }
}

void UI::SetCanGoBack(bool can_go_back) {
  back_button_.classList.toggle("disabled", !can_go_back);
}

void UI::SetCanGoForward(bool can_go_forward) {
  forward_button_.classList.toggle("disabled", !can_go_forward);
}

void UI::SetURL(const String& url) {
  // Never clobber an in-progress edit.
  if (address_focused_)
    return;
  address_.value = url.utf8().data();
}

///
/// Adapt the chrome to the platform's window controls. On macOS the native traffic lights
/// overlay the tab row: position them and tell the page how much space to leave. Elsewhere
/// the page shows its own caption buttons, registered as native hit-test regions so the OS
/// performs the window actions (hover still reaches the page for styling).
///
void UI::ApplyPlatformChrome() {
  has_native_controls_ = !window_->window_control_bounds().IsEmpty();
  if (has_native_controls_) {
    // Match the platform's native leading inset; the y value lines the visible button
    // glyphs up with the tab labels, which sit low in the tab row (and the buttons'
    // AppKit frames extend past their glyphs, so the two offsets are tuned together).
    window_->SetWindowControlInset(20, 16);
    Rect controls = window_->window_control_bounds();
    root_.classList.add("native-controls");
    root_.style.setProperty("--controls-clearance",
                            std::to_string((int)controls.right + 10) + "px");
    window_->SetHitTestRegions(nullptr, 0);
  } else {
    root_.classList.add("app-controls");
    UpdateHitTestRegions();
  }
  chrome_applied_ = true;
}

void UI::UpdateHitTestRegions() {
  double width = window_->width();
  HitTestRegion regions[] = {
    { HitRegionRole::Minimize, Rect::FromXYWH((float)width - 138, 0, 46, 40) },
    { HitRegionRole::Maximize, Rect::FromXYWH((float)width - 92, 0, 46, 40) },
    { HitRegionRole::Close,    Rect::FromXYWH((float)width - 46, 0, 46, 40) },
  };
  window_->SetHitTestRegions(regions, 3);
}
