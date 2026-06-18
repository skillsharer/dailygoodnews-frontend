import json
import re
import sqlite3
import requests
from pathlib import Path
from typing import Any

class NewsArchiveDB:
    def __init__(
        self,
        db_path="/var/lib/dailygoodnews/news.db",
        image_dir="/var/lib/dailygoodnews/images",
        public_image_prefix="/news-images",
    ):
        self.db_path = Path(db_path)
        self.image_dir = Path(image_dir)
        self.public_image_prefix = public_image_prefix.rstrip("/")

        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.image_dir.mkdir(parents=True, exist_ok=True)

        self.init_db()

    def connect(self):
        conn = sqlite3.connect(self.db_path, timeout=30)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=30000")
        return conn

    def init_db(self):
        with self.connect() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                article_id TEXT PRIMARY KEY,

                section TEXT NOT NULL,
                uuid TEXT NOT NULL,
                slug TEXT NOT NULL,

                heading TEXT NOT NULL,
                article TEXT,

                link TEXT,
                image_original_url TEXT,
                image_local_path TEXT,

                source TEXT,
                original_title TEXT,

                category TEXT DEFAULT 'general',
                tags_json TEXT DEFAULT '[]',

                date TEXT,

                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

                raw_json TEXT NOT NULL,

                UNIQUE(section, uuid),
                UNIQUE(section, slug)
            )
            """)

            conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_articles_section
            ON articles(section)
            """)

            conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_articles_category
            ON articles(category)
            """)

            conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_articles_created_at
            ON articles(created_at)
            """)

            conn.commit()

    @staticmethod
    def slugify(text):
        slug = re.sub(r"[^a-zA-Z0-9-]", "", str(text).replace(" ", "-"))
        return slug.lower().strip("-") or "article"

    @staticmethod
    def normalize_section(section):
        return section.strip().lower().replace("_", "-")

    @staticmethod
    def normalize_category(category):
        if not category:
            return "general"

        category = str(category).strip().lower()
        category = re.sub(r"[^a-z0-9]+", "-", category)

        return category.strip("-") or "general"

    @staticmethod
    def normalize_tags(tags):
        if not tags:
            return []

        if isinstance(tags, str):
            tags = [tags]

        if not isinstance(tags, list):
            return []

        cleaned = []

        for tag in tags:
            tag = str(tag).strip().lower()
            tag = re.sub(r"[^a-z0-9]+", "-", tag)
            tag = tag.strip("-")

            if tag:
                cleaned.append(tag)

        return sorted(set(cleaned))

    def make_unique_slug(self, conn, section, base_slug, article_id):
        slug = base_slug
        counter = 2

        while True:
            existing = conn.execute(
                """
                SELECT article_id
                FROM articles
                WHERE section = ? AND slug = ?
                """,
                (section, slug),
            ).fetchone()

            if existing is None:
                return slug

            if existing["article_id"] == article_id:
                return slug

            slug = f"{base_slug}-{counter}"
            counter += 1

    def download_image(self, image_url, article_id):
        if not image_url:
            return None

        try:
            response = requests.get(
                image_url,
                timeout=10,
                headers={
                    "User-Agent": "DailyGoodNewsBot/1.0"
                },
            )
            response.raise_for_status()

            content_type = response.headers.get("Content-Type", "")

            if not content_type.startswith("image/"):
                return None

            if "png" in content_type:
                ext = ".png"
            elif "webp" in content_type:
                ext = ".webp"
            elif "gif" in content_type:
                ext = ".gif"
            else:
                ext = ".jpg"

            safe_name = re.sub(r"[^a-zA-Z0-9_-]+", "-", article_id)
            filename = f"{safe_name}{ext}"

            path = self.image_dir / filename
            path.write_bytes(response.content)

            return f"{self.public_image_prefix}/{filename}"

        except Exception as exc:
            print(f"Image download failed: {image_url} | {exc}")
            return None

    def archive_article(self, item: dict[str, Any], section: str):
        section = self.normalize_section(section)

        if "uuid" not in item:
            raise ValueError("Article is missing required field: uuid")

        uuid = str(item["uuid"])
        heading = item.get("heading", "Untitled")
        base_slug = self.slugify(heading)

        article_id = f"{section}:{uuid}"

        image_original_url = item.get("image")
        tags = self.normalize_tags(item.get("tags"))
        category = self.normalize_category(item.get("category"))

        with self.connect() as conn:
            existing = conn.execute(
                """
                SELECT slug, image_local_path
                FROM articles
                WHERE article_id = ?
                """,
                (article_id,),
            ).fetchone()

            if existing:
                # Keep the old slug stable even if heading changes later.
                slug = existing["slug"]
                image_local_path = existing["image_local_path"]
            else:
                slug = self.make_unique_slug(
                    conn=conn,
                    section=section,
                    base_slug=base_slug,
                    article_id=article_id,
                )
                image_local_path = None

            if not image_local_path:
                image_local_path = self.download_image(
                    image_original_url,
                    article_id.replace(":", "-"),
                )

            conn.execute(
                """
                INSERT INTO articles (
                    article_id,
                    section,
                    uuid,
                    slug,
                    heading,
                    article,
                    link,
                    image_original_url,
                    image_local_path,
                    source,
                    original_title,
                    category,
                    tags_json,
                    date,
                    updated_at,
                    raw_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                ON CONFLICT(article_id) DO UPDATE SET
                    heading = excluded.heading,
                    article = excluded.article,
                    link = excluded.link,
                    image_original_url = excluded.image_original_url,
                    image_local_path = COALESCE(articles.image_local_path, excluded.image_local_path),
                    source = excluded.source,
                    original_title = excluded.original_title,
                    category = excluded.category,
                    tags_json = excluded.tags_json,
                    date = excluded.date,
                    updated_at = CURRENT_TIMESTAMP,
                    raw_json = excluded.raw_json
                """,
                (
                    article_id,
                    section,
                    uuid,
                    slug,
                    heading,
                    item.get("article"),
                    item.get("link"),
                    image_original_url,
                    image_local_path,
                    item.get("source"),
                    item.get("original_title"),
                    category,
                    json.dumps(tags, ensure_ascii=False),
                    item.get("date"),
                    json.dumps(item, ensure_ascii=False),
                ),
            )

            conn.commit()

    def archive_articles(self, items: list[dict[str, Any]], section: str):
        for item in items:
            self.archive_article(item, section)

    def get_article_by_slug(self, section: str, slug: str):
        section = self.normalize_section(section)

        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT *
                FROM articles
                WHERE section = ? AND slug = ?
                """,
                (section, slug),
            ).fetchone()

        if row is None:
            return None

        article = dict(row)
        article["tags"] = json.loads(article.get("tags_json") or "[]")
        article["raw"] = json.loads(article.get("raw_json") or "{}")

        return article

    def get_article_by_uuid(self, section: str, uuid: str):
        section = self.normalize_section(section)

        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT *
                FROM articles
                WHERE section = ? AND uuid = ?
                """,
                (section, uuid),
            ).fetchone()

        if row is None:
            return None

        article = dict(row)
        article["tags"] = json.loads(article.get("tags_json") or "[]")
        article["raw"] = json.loads(article.get("raw_json") or "{}")

        return article

    def sitemap_rows(self, limit=5000):
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT section, slug, updated_at
                FROM articles
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [dict(row) for row in rows]