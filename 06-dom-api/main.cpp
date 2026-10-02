#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <Ultralight/DOM.h>

#include <string>

using namespace ultralight;

///
/// Welcome to Sample 6!
///
/// In this sample we'll drive a page through the native DOM API, with the page's JavaScript
/// turned off entirely (ViewConfig::enable_javascript = false).
///
/// The dom layer lets you manipulate the DOM and its elements directly from native code
/// (including event callbacks!) without *any* JavaScript.
///
/// This is a big deal when it comes to performance and memory usage-- allowing you to build
/// rich, interactive web UIs with the expressivity of modern HTML / CSS and the efficiency
/// of native code.
///
/// What's more, the dom layer uses familiar JavaScript syntax (eg, `document.getElementById`)
/// along with CSS selectors and consteval CSS unit parsing so you can write code that looks
/// like JavaScript but runs natively.
///
/// We'll register all of our page wiring once in a dom::Triggers registry and attach it to
/// our View: every page the View loads gets the wiring automatically, so there is nothing to
/// re-register across navigations.
///
/// Our page is a small settings panel with a toggle, a dropdown, and a slider. The dropdown is
/// built from plain elements, so we write its behavior here in native code too.
///
class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;

  ///
  /// The page wiring (delegated listeners + DOM-ready hooks), registered once below.
  ///
  dom::Triggers page_;

  ///
  /// Handles to the elements we keep updating. Handles are identity, not lifetime: if the
  /// page ever navigated away they would go inert (operations become benign no-ops), never
  /// dangle.
  ///
  dom::Element notifications_;
  dom::Element quality_;
  dom::Element quality_label_;
  dom::Element volume_;
  dom::Element volume_fill_;
  dom::Element summary_;
  dom::Element status_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();

    ///
    /// Create our Window, hidden until its page is ready (see ShowWhenReady() below).
    ///
    window_ = Window::Create(app_->main_monitor(), 490, 566, false,
                             WindowFlags::Titled | WindowFlags::Hidden);
    window_->SetTitle("Ultralight Sample 6 - DOM API");
    window_->set_listener(this);

    ///
    /// Add a panel to our Window (with JavaScript disabled).
    ///
    ViewConfig view_config = window_->default_view_config();
    view_config.enable_javascript = false;
    panel_ = window_->AddPanel({}, view_config);

    ///
    /// Wire the page to C++ lambdas by CSS selector.
    ///
    page_.On("#notifications", "change", [this] { OnSettingsChanged(); });
    page_.On("#volume", "input", [this] { OnSettingsChanged(); });
    page_.On("#save", "click", [this] {
      status_.textContent = "Settings saved.";
      status_.classList.toggle("dirty", false);
    });

    ///
    /// The quality dropdown: its button opens and closes the menu, an option records the
    /// choice, and a press anywhere outside the dropdown (or the Escape key) closes it.
    ///
    page_.On(".dropdown-button", "click", [this] { quality_.classList.toggle("open"); });
    page_.On(".option", "click", [this](dom::Element option) { SelectQuality(option); });
    page_.On("html", "mousedown", [this](dom::Event event, dom::Element) {
      if (!event.target().closest("#quality"))
        quality_.classList.toggle("open", false);
    });
    page_.On("html", "keydown", [this](dom::Event event, dom::Element) {
      if (event.AsKeyboard().key() == "Escape")
        quality_.classList.toggle("open", false);
    });

    ///
    /// Once the DOM has loaded, cache the elements that we'll be updating.
    ///
    page_.OnDOMReady([this](dom::Document doc) {
      notifications_ = doc.getElementById("notifications");
      quality_ = doc.getElementById("quality");
      quality_label_ = doc.getElementById("quality-label");
      volume_ = doc.getElementById("volume");
      volume_fill_ = doc.getElementById("volume-fill");
      summary_ = doc.getElementById("summary");
      status_ = doc.getElementById("status");
      RefreshSummary();
    });

    ///
    /// Attach the dom bindings to our View before loading any content.
    ///
    /// By default, only local pages (`file://`) and HTML you load directly will have access
    /// to the dom bindings unless you override the origin rules.
    ///
    if (page_.AttachTo(panel_->view().get()))
      panel_->view()->LoadURL("file:///settings.html");

    ///
    /// Show the window once the page has loaded and settled, so the first frame on screen is
    /// the finished form (with the summary we fill in from OnDOMReady) instead of a blank
    /// window.
    ///
    window_->ShowWhenReady();
  }

  virtual ~MyApp() {}

  ///
  /// Read the whole form natively and reflect it back into the page.
  ///
  void RefreshSummary() {
    ///
    /// Form state reads use the same names page script would: `checked`, `value`, and
    /// `dataset` (the dropdown keeps its choice in a data-value attribute).
    ///
    bool notify = notifications_.checked;
    std::string quality(quality_.dataset["value"]);
    std::string volume(volume_.value);

    ///
    /// Style writes go through the style proxy. The typed unit factories skip CSS string
    /// parsing entirely (you can also assign literals like "50%").
    ///
    volume_fill_.style.width = dom::StyleValue::Pct(std::stod(volume));

    std::string text = "Notifications " + std::string(notify ? "on" : "off") + "  /  "
                       + quality + " quality  /  Volume " + volume + "%";
    summary_.textContent = text.c_str();
  }

  ///
  /// Called when the user picks a quality option: mark it selected, record its value on the
  /// dropdown, show it on the button, and close the menu.
  ///
  void SelectQuality(dom::Element option) {
    for (dom::Element item : quality_.querySelectorAll(".option"))
      item.classList.toggle("selected", item.IsSame(option));

    std::string value(option.dataset["value"]);
    quality_.dataset["value"] = value.c_str();
    quality_label_.textContent = value.c_str();
    quality_.classList.toggle("open", false);
    OnSettingsChanged();
  }

  ///
  /// Called (via the delegated listeners above) whenever the user touches a control.
  ///
  void OnSettingsChanged() {
    RefreshSummary();
    status_.textContent = "Unsaved changes";
    status_.classList.toggle("dirty", true);
  }

  ///
  /// Inherited from WindowListener, called when the Window is closed.
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
