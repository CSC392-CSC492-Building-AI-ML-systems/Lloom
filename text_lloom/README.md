Directory for the LLooM python package

## Setup

First, build the frontend assets from the repository root:

```bash
npm install
npm run build
```

Navigate to the `text_lloom` directory:

```bash
cd text_lloom
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install LLooM and its dependencies in editable mode:

```bash
pip install -e .
```

Changes made to the source code in `src/text_lloom/` will be reflected without needing to reinstall the package.

To deactivate the virtual environment:

```bash
deactivate
```