#pragma once
#include <AppCore/AppCore.h>
#include <Ultralight/DOM.h>
#include "Tab.h"
#include <map>
#include <memory>

using namespace ultralight;

///
/// Browser chrome: the tab strip and toolbar rendered as one script-free HTML page in a
/// fixed-height panel at the top of the window.
///
/// All wiring is native: dom::Listeners routes the page's clicks and key presses to the
/// methods below, and state flows back through held element handles (the tab strip's
/// elements are created and updated with the DOM API directly, so the page needs no
/// script of its own).
///
class UI : public WindowListener {
 public:
  UI(RefPtr<Window> window);
  ~UI();

  // Inherited from WindowListener
  virtual void OnClose(ultralight::Window* window) override;
  virtual void OnResize(ultralight::Window* window, double width, double height) override;
  virtual void OnWindowStateChanged(ultralight::Window* window, WindowState state) override;
  virtual void OnActivationChanged(ultralight::Window* window, bool active) override;

  RefPtr<Window> window() { return window_; }

 protected:
  static constexpr uint64_t kNoTab = ~0ull;

  // Toolbar commands (wired by selector in the constructor).
  void OnBack();
  void OnForward();
  void OnRefresh();
  void OnStop();
  void OnToggleTools();
  void NavigateToAddressInput();

  // Tab management.
  void CreateNewTab();
  RefPtr<View> CreateNewTabForChildView(const String& url);
  void ActivateTab(uint64_t id);
  void CloseTab(uint64_t id);
  void UpdateTabTitle(uint64_t id, const String& title);
  void UpdateTabURL(uint64_t id, const String& url);
  void UpdateTabNavigation(uint64_t id, bool is_loading, bool can_go_back, bool can_go_forward);

  // Tab-strip DOM (the chrome page's elements, driven natively).
  void AddTabElement(uint64_t id, const String& title);
  void RemoveTabElement(uint64_t id);
  void SetActiveTabElement(uint64_t id);

  // Toolbar state (held element handles).
  void RefreshToolbarState();
  void SetLoading(bool is_loading);
  void SetCanGoBack(bool can_go_back);
  void SetCanGoForward(bool can_go_forward);
  void SetURL(const String& url);

  // Platform chrome: traffic-light clearance on macOS, app-drawn caption buttons with
  // native hit-test regions everywhere else.
  void ApplyPlatformChrome();
  void UpdateHitTestRegions();

  Tab* active_tab() {
    auto it = tabs_.find(active_tab_id_);
    return it == tabs_.end() ? nullptr : it->second.get();
  }

  RefPtr<View> view() { return panel_->view(); }

  RefPtr<Window> window_;
  RefPtr<Panel> panel_;

  std::map<uint64_t, std::unique_ptr<Tab>> tabs_;
  uint64_t active_tab_id_ = kNoTab;
  uint64_t tab_id_counter_ = 0;

  dom::Listeners listeners_;

  // Held chrome-page handles. The chrome page never navigates, so these stay valid for
  // the life of the window.
  dom::Document doc_;
  dom::Element root_;
  dom::Element tab_strip_;
  dom::Element address_;
  dom::Element back_button_;
  dom::Element forward_button_;
  dom::Element refresh_button_;
  dom::Element stop_button_;

  struct TabElements {
    dom::Element tab;
    dom::Element title;
  };
  std::map<uint64_t, TabElements> tab_elements_;

  bool address_focused_ = false;
  bool select_address_on_mouseup_ = false;
  bool has_native_controls_ = false;
  bool chrome_applied_ = false;

  friend class Tab;
};
