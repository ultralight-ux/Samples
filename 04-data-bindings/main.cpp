#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <Ultralight/dom/data/Context.h>

#include <atomic>
#include <chrono>
#include <cmath>
#include <string>
#include <thread>

namespace dd = ultralight::dom::data;
using namespace ultralight;

///
/// Welcome to Sample 4!
///
/// In this sample we'll synchronize C++ state with a page using dom::data bindings.
///
/// The DOM data bindings API allows you to bind C++ values (structs / classes / members)
/// to special "placeholders" in HTML, keeping the C++ state and page automatically in sync.
///
/// A simulation thread owns the "Dashboard" model below. On every tick, it mutates the members
/// then calls Sync() to publish whatever changed to the page.
///
/// Actions are also supported-- typing in the text field and clicking the button triggers calls
/// to the handlers registered below.
///

namespace sample {

///
/// The dashboard model: plain data members.
///
struct Dashboard {
  int64_t requests = 0;
  double load = 0;
  std::string name = "Overview";
};

}  // namespace sample

///
/// We declare the schema for the Dashboard struct here.
///
/// The schema is a compile-time description of the model's members, their names, and any special
/// behavior (Editable, Validators, Actions).
///
/// The names of the fields will be bound to any placeholders in the page that start with `dash.`
/// (eg, `Dashboard::requests` -> `dash.requests`).
///
template <>
struct dd::TypeTraits<sample::Dashboard> {
  static constexpr auto schema = Schema(
      Field("requests", &sample::Dashboard::requests),
      Field("load", &sample::Dashboard::load),
      Field("name", &sample::Dashboard::name, Editable,
            Validate([](std::string s) {
              // You can declare optional validators for editable fields:
              //
              // Clamp "name" to 24 bytes (The field snaps to whatever a validator returns.)
              size_t n = 24;
              if (s.size() <= n)
                return s;
              // Truncate the string if it exceeds the limit (without splitting a UTF-8 codepoint).
              while (n > 0 && (static_cast<unsigned char>(s[n]) & 0xC0) == 0x80)
                n--;
              s.resize(n);
              return s;
            })),
      // You can also declare actions that the page can trigger.
      Action("reset"));
};

///
/// The simulation thread owns the model and its Context (a Context is homed to the thread that
/// creates it), and publishes once per tick.
///
static void RunSimulationThread(View* view, std::atomic<bool>& quit) {
  dd::Context ctx = dd::Context::Create();

  ///
  /// The page's `{{dash.load|pct}}` pipe runs this formatter whenever that text re-renders.
  ///
  ctx.DefineFormat("pct", [](dd::Value v) {
    return std::to_string(static_cast<int>(std::lround(v.Or(0.0)))) + "%";
  });

  sample::Dashboard dash;

  ///
  /// Bind the model under the name the page's paths start with (`dash.requests` etc.), and
  /// register the inbound handlers. Handlers run inside Sync() on this thread, so they can
  /// touch the model like any other simulation code.
  ///
  dd::Binding binding
      = ctx.Bind("dash", dash)
            .OnChange<"name">([&](std::string_view v) { dash.name = v; })
            .OnAction<"reset">([&] { dash.requests = 0; });

  ctx.AttachTo(*view);

  ///
  /// The simulation just mutates members and calls Sync(). Nothing here knows about the page.
  ///
  int tick = 0;
  while (!quit.load(std::memory_order_relaxed)) {
    tick++;
    if (tick % 15 == 0)
      dash.requests += 1 + (tick / 15) % 3;

    double t = tick / 60.0;
    dash.load = 50.0 + 30.0 * std::sin(t * 0.6) + 15.0 * std::sin(t * 1.7 + 1.3);

    ctx.Sync();
    std::this_thread::sleep_for(std::chrono::milliseconds(16));
  }

  ctx.DetachFrom(*view);
}

class MyApp : public WindowListener {
  RefPtr<App> app_;
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;
  std::atomic<bool> quit_ { false };
  std::thread simulation_thread_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    app_ = App::Create();

    ///
    /// Create our Window.
    ///
    window_ = Window::Create(app_->main_monitor(), 480, 400, false, WindowFlags::Titled);
    window_->SetTitle("Ultralight Sample 4 - Data Bindings");
    window_->set_listener(this);

    ///
    /// Add a web-content panel and load the dashboard page.
    ///
    panel_ = window_->AddPanel();
    panel_->view()->LoadURL("file:///dashboard.html");

    ///
    /// Start the simulation thread. This thread never touches the model or the Context again.
    ///
    simulation_thread_ = std::thread(RunSimulationThread, panel_->view().get(), std::ref(quit_));
  }

  virtual ~MyApp() {}

  ///
  /// Stop the simulation and wait for the simulation thread to finish (it detaches from the View
  /// on its way out). Safe to call more than once.
  ///
  void StopSimulationThread() {
    quit_.store(true, std::memory_order_relaxed);
    if (simulation_thread_.joinable())
      simulation_thread_.join();
  }

  ///
  /// Inherited from WindowListener, called when the Window is closed.
  ///
  /// The simulation thread publishes to this window's View, so we join it before the window goes
  /// away.
  ///
  virtual void OnClose(ultralight::Window* window) override {
    StopSimulationThread();
    app_->Quit();
  }

  void Run() {
    app_->Run();
    StopSimulationThread();
  }
};

int main() {
  MyApp app;
  app.Run();

  return 0;
}
