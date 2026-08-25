#include <AppCore/App.h>
#include <AppCore/Window.h>
#include <Ultralight/JS.h>

#include <memory>
#include <string>

using namespace ultralight;

///
/// Welcome to Sample 11!
///
/// In this sample we'll spawn two application windows that work together: a code editor on
/// the left and a live preview on the right. Each window owns its own layout tree and View;
/// the App instance drives them both.
///
/// The editor page talks to native code through the js:: bridge: we register one typed
/// function (`native.updateEditor`) and attach the registry to the editor's View before
/// loading it, so the binding is there from the first page load. Whenever the editor's
/// content changes, native code hands the new HTML to the preview window with LoadHTML().
///

class HTMLWindow : public WindowListener {
  RefPtr<Window> window_;
  RefPtr<Panel> panel_;
public:
  HTMLWindow(const char* title, int x, int y, int width, int height) {
    window_ = Window::Create(App::instance()->main_monitor(), width, height, false,
      WindowFlags::Titled | WindowFlags::Resizable | WindowFlags::Hidden);
    window_->MoveTo(x, y);
    window_->SetTitle(title);
    window_->Show();
    window_->set_listener(this);

    /// Each window has its own layout tree; a bare AddPanel() fills the window and tracks its
    /// size automatically.
    panel_ = window_->AddPanel();
  }

  inline RefPtr<View> view() { return panel_->view(); }
  inline RefPtr<Window> window() { return window_; }
  inline RefPtr<Panel> panel() { return panel_; }

  virtual void OnClose(ultralight::Window* window) override {
    // We quit the application when any of the windows are closed.
    App::instance()->Quit();
  }

};

///
/// Interface the editor window reports content changes through, so the window class stays
/// reusable and the application decides what an update means.
///
class SampleEditorListener {
public:
  SampleEditorListener() {}
  virtual ~SampleEditorListener() {}
  virtual void OnUpdateEditor(const ultralight::String& content) = 0;
};

class EditorWindow : public HTMLWindow {
  SampleEditorListener* editor_listener_ = nullptr;

  ///
  /// The editor's binding registry, rooted at the page-visible `native` namespace.
  ///
  js::API api_ { "native" };
public:
  EditorWindow(const char* title, const char* url, int x, int y, int width, int height)
    : HTMLWindow(title, x, y, width, height) {
    ///
    /// One typed function is the whole bridge: the editor page calls
    /// `native.updateEditor(content)` with the document text. The library converts the
    /// argument to std::string for us; a mis-typed call becomes a TypeError on the page.
    ///
    api_.Bind("updateEditor", [this](std::string content) {
      if (editor_listener_)
        editor_listener_->OnUpdateEditor(content.c_str());
    }, js::Param("content"));

    ///
    /// Attach the registry before loading, so the binding is available to the page's own
    /// startup script. Bindings survive navigation; there is nothing to re-register.
    ///
    if (api_.AttachTo(view().get()))
      view()->LoadURL(url);
  }

  void set_editor_listener(SampleEditorListener* listener) { editor_listener_ = listener; }

  SampleEditorListener* editor_listener() { return editor_listener_; }
};

class MyApp : public SampleEditorListener  {
  RefPtr<App> app_;
  std::unique_ptr<EditorWindow> editor_window_;
  std::unique_ptr<HTMLWindow> preview_window_;
public:
  MyApp() {
    ///
    /// Create our main App instance.
    ///
    /// The App class is responsible for the lifetime of the application
    /// and is required to create any windows.
    ///
    app_ = App::Create();

    editor_window_.reset(new EditorWindow("Ultralight Sample 11 - HTML Editor",
                                          "file:///editor.html", 50, 50, 600, 700));
    editor_window_->set_editor_listener(this);

    preview_window_.reset(new HTMLWindow("Ultralight Sample 11 - Live Preview",
                                         700, 50, 600, 700));
    preview_window_->view()->LoadURL("file:///preview.html");
  }

  virtual ~MyApp() {}

  ///
  /// The editor reported new content: render it in the preview window. LoadHTML() replaces
  /// the preview's page wholesale, which is exactly right for arbitrary typed HTML (the
  /// editor debounces its change events, so this is not called per keystroke).
  ///
  virtual void OnUpdateEditor(const ultralight::String& content) override {
    preview_window_->view()->LoadHTML(content);
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
