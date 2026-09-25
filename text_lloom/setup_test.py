import asyncio

import pandas as pd
from dotenv import load_dotenv

import text_lloom.workbench as wb

# Based on code from here: https://colab.research.google.com/github/michelle123lam/lloom/blob/main/docs/public/nb/24_11_LLooM_GettingStartedTemplate_v1.ipynb

pd.set_option("display.max_colwidth", None)
pd.set_option("display.max_rows", None)

load_dotenv()


async def main():

    data_link = "https://michelle123lam.github.io/lloom/data/political_fb_posts_100.csv"
    df = pd.read_csv(data_link)

    print(df[["doc_id", "text"]].head())

    lloom = wb.lloom(
        df=df,
        text_col="text",
        id_col="doc_id"
    )

    cur_seed = None
    await lloom.gen(seed=cur_seed)

    lloom.summary()


if __name__ == "__main__":
    asyncio.run(main())