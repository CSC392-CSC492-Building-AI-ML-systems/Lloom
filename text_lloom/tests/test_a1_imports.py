# A1: text_lloom must import without the built widget files (npm run build) or network access.
import os
import pathlib
import shutil
import subprocess
import sys

import pytest

PKG_DIR = pathlib.Path(__file__).parents[1] / "src" / "text_lloom"


def run_without_static(tmp_path, code):
    # Copy the package without static/, then run `code` against that copy in a fresh interpreter.
    # nltk.download is made to fail, so any download at import shows up as an error.
    shutil.copytree(PKG_DIR, tmp_path / "text_lloom", ignore=shutil.ignore_patterns("static", "__pycache__"))
    script = (
        "import nltk\n"
        "def no_download(*args, **kwargs): raise RuntimeError('nltk.download called')\n"
        "nltk.download = no_download\n"
        "import text_lloom\n"
        f"assert text_lloom.__file__.startswith({str(tmp_path)!r}), text_lloom.__file__\n"
        + code
    )
    return subprocess.run([sys.executable, "-c", script], cwd=tmp_path, capture_output=True, text=True,
                          env={**os.environ, "PYTHONPATH": str(tmp_path)})


def test_workbench_imports_without_static_or_nltk_download(tmp_path):
    result = run_without_static(tmp_path, "import text_lloom.workbench\n")
    assert result.returncode == 0, result.stderr


def test_widget_without_static_raises_a_clear_error(tmp_path):
    code = (
        "from text_lloom import MatrixWidget\n"
        "try:\n"
        "    MatrixWidget()\n"
        "except FileNotFoundError as e:\n"
        "    assert 'npm run build' in str(e), e\n"
        "else:\n"
        "    raise AssertionError('no error raised')\n"
    )
    result = run_without_static(tmp_path, code)
    assert result.returncode == 0, result.stderr


def test_auto_suggest_parameters_still_tokenizes_sentences(monkeypatch):
    # punkt_tab is now fetched on first use instead of at import
    import pandas as pd
    import text_lloom.workbench as wb
    monkeypatch.setenv("OPENAI_API_KEY", "k")
    df = pd.DataFrame({"id": ["1", "2"], "text": ["One. Two. Three. Four.", "One. Two. Three. Four."]})
    params = wb.lloom(df=df, text_col="text", id_col="id").auto_suggest_parameters()
    assert params["filter_n_quotes"] == 3  # ceil(4 sentences * 0.75)


@pytest.mark.skipif(not (PKG_DIR / "static" / "index.js").is_file(), reason="widgets not built")
def test_widgets_still_load_their_js_and_css_when_built():
    from text_lloom import ConceptSelectWidget, MatrixWidget
    matrix, select = MatrixWidget(), ConceptSelectWidget()
    assert matrix._esm == (PKG_DIR / "static" / "index.js").read_text(encoding="utf-8")
    assert matrix._css == (PKG_DIR / "static" / "index.css").read_text(encoding="utf-8")
    assert select._esm == (PKG_DIR / "static" / "index_select.js").read_text(encoding="utf-8")
    assert select._css == (PKG_DIR / "static" / "index_select.css").read_text(encoding="utf-8")
