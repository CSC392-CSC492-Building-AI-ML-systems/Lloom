import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("text_lloom")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

_DEV = False # switch to False for production

# Path to static from text_lloom/src/text_lloom (the python package)
bundled_assets_dir = pathlib.Path(__file__).parent / "static"

def _load_assets(widget_cls, js_file, css_file):
  # Fill in the widget's JS/CSS on first use, not at import, so the package
  # can be imported (e.g. by the backend) without running `npm run build`
  if "_esm" in widget_cls.__dict__:
    return
  if _DEV:
    # from `npx vite`
    widget_cls._esm = f"http://localhost:5173/src/{js_file}?anywidget"
    widget_cls._css = ""
    return
  # from `npm run build`
  js_path, css_path = bundled_assets_dir / js_file, bundled_assets_dir / css_file
  if not (js_path.is_file() and css_path.is_file()):
    raise FileNotFoundError(f"LLooM widget files not found in {bundled_assets_dir}. Run `npm install && npm run build` from the repo root.")
  widget_cls._esm = js_path.read_text(encoding="utf-8")
  widget_cls._css = css_path.read_text(encoding="utf-8")


"""
MATRIX WIDGET
Widget instantiated with anywidget that displays the matrix visualization
"""
class MatrixWidget(anywidget.AnyWidget):
    name = traitlets.Unicode().tag(sync=True)

    data = traitlets.Unicode().tag(sync=True)  # syncs the widget's `data` property
    data_items = traitlets.Unicode().tag(sync=True)  # syncs the widget's `data_items` property
    data_items_wide = traitlets.Unicode().tag(sync=True)  # syncs the widget's `data_items_wide` property
    metadata = traitlets.Unicode().tag(sync=True)  # syncs the widget's `metadata` property
    slice_col = traitlets.Unicode().tag(sync=True)  # syncs the widget's `slice_col` property
    norm_by = traitlets.Unicode().tag(sync=True)  # syncs the widget's `norm_by` property

    def __init__(self, *args, **kwargs):
        _load_assets(MatrixWidget, "index.js", "index.css")
        super().__init__(*args, **kwargs)

"""
CONCEPT SELECT WIDGET
Widget instantiated with anywidget that displays the concepts for selection
"""
class ConceptSelectWidget(anywidget.AnyWidget):
    name = traitlets.Unicode().tag(sync=True)

    data = traitlets.Unicode().tag(sync=True)  # syncs the widget's `data` property

    def __init__(self, *args, **kwargs):
        _load_assets(ConceptSelectWidget, "index_select.js", "index_select.css")
        super().__init__(*args, **kwargs)
