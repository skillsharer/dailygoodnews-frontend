# import_all_news_jsons.py

import json
import os
from pathlib import Path

from db import NewsArchiveDB


ROOT = os.path.dirname(os.path.dirname(__file__))

NEWS_SOURCE = f"{ROOT}/artifacts/news/news.json"
COFFEE_BREAK_SOURCE = f"{ROOT}/artifacts/coffee_break/coffee_break.json"
KNOWLEDGE_VAULT_SOURCE = f"{ROOT}/artifacts/knowledge_vault/knowledge_vault.json"
STORY_TIME_SOURCE = f"{ROOT}/artifacts/story_time/story_time.json"

DATA_DIR = Path("/var/lib/dailygoodnews")

db = NewsArchiveDB(
    db_path=DATA_DIR / "news.db",
    image_dir=DATA_DIR / "images",
    public_image_prefix="/news-images",
)


SECTION_FILES = {
    "news": NEWS_SOURCE,
    "coffee-break": COFFEE_BREAK_SOURCE,
    "knowledge-vault": KNOWLEDGE_VAULT_SOURCE,
    "story-time": STORY_TIME_SOURCE,
}


def load_json_data(source_file):
    with open(source_file, "r", encoding="utf-8") as jsonfile:
        data = json.load(jsonfile)

    if isinstance(data, dict):
        return [data]

    if isinstance(data, list):
        return data

    return []


def main():
    total = 0

    for section, source_file in SECTION_FILES.items():
        if not os.path.exists(source_file):
            print(f"Missing file, skipping: {source_file}")
            continue

        articles = load_json_data(source_file)

        db.archive_articles(
            articles,
            section=section,
        )

        print(f"Imported {len(articles)} articles from section: {section}")
        total += len(articles)

    print(f"Done. Total imported: {total}")


if __name__ == "__main__":
    main()