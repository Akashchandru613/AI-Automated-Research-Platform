import pandas as pd
import pdfplumber


def parse_csv(file_path: str) -> dict:
    df = pd.read_csv(file_path)
    return {
        "columns": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "row_count": len(df),
        "rows": df.head(50).values.tolist(),
        "full_data": df.to_dict(orient="list"),
    }


def parse_pdf(file_path: str) -> dict:
    text_pages = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_pages.append(page_text)
    full_text = "\n\n".join(text_pages)
    return {
        "text": full_text,
        "page_count": len(text_pages),
        "preview": full_text[:2000],
    }


def get_csv_preview(file_path: str, max_rows: int = 50) -> dict:
    df = pd.read_csv(file_path, nrows=max_rows)
    return {
        "columns": df.columns.tolist(),
        "rows": df.values.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }
