# src/importer.py

import json
import os
from pathlib import Path

from .db import NewsArchiveDB


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


def save_json_data(source_file, articles):
    tmp_file = f"{source_file}.tmp"

    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=4)

    os.replace(tmp_file, source_file)


def main():
    total = 0

    for section, source_file in SECTION_FILES.items():
        if not os.path.exists(source_file):
            print(f"Missing file, skipping: {source_file}")
            continue

        articles = load_json_data(source_file)

        archived_articles = db.archive_articles(
            articles,
            section=section,
        )

        archived_by_uuid = {
            str(item["uuid"]): item
            for item in archived_articles
            if item and item.get("uuid")
        }

        updated_articles = []

        for article in articles:
            article = dict(article)
            uuid = str(article.get("uuid", ""))

            db_article = archived_by_uuid.get(uuid)

            if db_article:
                article["slug"] = db_article["slug"]

            updated_articles.append(article)

        save_json_data(source_file, updated_articles)

        print(f"Imported {len(articles)} articles from section: {section}")
        total += len(articles)

    print(f"Done. Total imported: {total}")


if __name__ == "__main__":
    main()