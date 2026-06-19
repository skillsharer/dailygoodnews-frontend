import bleach
from flask import Flask, render_template, send_from_directory, abort, Response, request
import json
import re
import datetime
import os
import html
from dotenv import load_dotenv, find_dotenv
from .db import NewsArchiveDB


load_dotenv(find_dotenv())

ROOT = os.path.dirname(os.path.dirname(__file__))

NEWS_SOURCE = f"{ROOT}/artifacts/news/news.json"
COFFEE_BREAK_SOURCE = f"{ROOT}/artifacts/coffee_break/coffee_break.json"
KNOWLEDGE_VAULT_SOURCE = f"{ROOT}/artifacts/knowledge_vault/knowledge_vault.json"
STORY_TIME_SOURCE = f"{ROOT}/artifacts/story_time/story_time.json"

app = Flask(
    __name__,
    template_folder=f"{ROOT}/templates",
    static_folder=f"{ROOT}/static",
)

GOOGLE_SITE_VERIFICATION = os.getenv("GOOGLE_SITE_VERIFICATION")

DATA_DIR = "/var/lib/dailygoodnews"

archive_db = NewsArchiveDB(
    db_path=f"{DATA_DIR}/news.db",
    image_dir=f"{DATA_DIR}/images",
    public_image_prefix="/news-images",
)


def slugify(text):
    slug = re.sub(r"[^a-zA-Z0-9-]", "", str(text).replace(" ", "-"))
    return slug.lower().strip("-") or "article"


def extract_first_image(html_string):
    """Extracts the src attribute of the first img tag in an HTML string."""
    match = re.search(r'<img.*?src="(.*?)"', html_string or "")

    if match:
        return match.group(1)

    return None


def resolve_story_time_image(image_value):
    """Convert Story Time JSON image filenames into served artifact URLs."""
    image_value = str(image_value or "").strip()

    if not image_value:
        return None

    if image_value.startswith(("/", "http://", "https://", "data:")):
        return image_value

    if image_value.startswith("artifacts/"):
        return f"/{image_value}"

    if image_value.startswith("story_time/"):
        return f"/artifacts/{image_value}"

    return f"/artifacts/story_time/images/{image_value}"


def resolve_story_time_article_images(article_html):
    """Normalize Story Time body image sources to local artifact URLs."""
    def replace_image_src(match):
        quote = match.group(1)
        image_src = match.group(2)
        resolved_src = resolve_story_time_image(
            os.path.basename(image_src) if "objkt.com" in image_src else image_src
        )

        return f"src={quote}{resolved_src or image_src}{quote}"

    return re.sub(
        r"src=(['\"])([^'\"]+?\.webp)\1",
        replace_image_src,
        article_html or "",
        flags=re.IGNORECASE,
    )


def load_json_data(source_file):
    """Load JSON data from a file."""
    with open(source_file, "r", encoding="utf-8") as jsonfile:
        data = json.load(jsonfile)

    if isinstance(data, dict):
        return [data]

    if isinstance(data, list):
        return data

    return []


def add_slugs_to_articles(articles, url_prefix, section=None):
    """
    Adds:
    - slug
    - url

    Important:
    The importer should write the final unique DB slug back into the JSON.
    This function should not query SQLite by UUID, because reused UUIDs can
    accidentally point new preview cards to old archived articles.
    """
    for article in articles:
        article["slug"] = article.get("slug") or slugify(
            article.get("heading", "article")
        )

        article["url"] = f"{url_prefix}/{article['slug']}"

    return articles


# Bleach Sanitizer
def sanitize_html(value):
    allowed_tags = [
        "p",
        "br",
        "a",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "div",
        "img",
        "span",
    ]

    allowed_attributes = {
        "a": ["href", "title", "target"],
        "img": ["src", "alt", "style", "class"],
        "div": ["style", "class"],
        "p": ["style", "class"],
        "span": ["style", "class"],
        "h1": ["style", "class"],
        "h2": ["style", "class"],
        "h3": ["style", "class"],
        "h4": ["style", "class"],
        "h5": ["style", "class"],
        "h6": ["style", "class"],
        "li": ["style", "class"],
        "ul": ["style", "class"],
        "ol": ["style", "class"],
    }

    allowed_protocols = ["http", "https", "data"]

    return bleach.clean(
        value or "",
        tags=allowed_tags,
        attributes=allowed_attributes,
        protocols=allowed_protocols,
        strip=True,
    )


app.jinja_env.filters["sanitize_html"] = sanitize_html


@app.context_processor
def inject_global_vars():
    return {
        "google_site_verification": GOOGLE_SITE_VERIFICATION,
        "now": datetime.datetime.now(),
    }


@app.route("/")
def home():
    news_list = add_slugs_to_articles(
        load_json_data(NEWS_SOURCE),
        url_prefix="/news",
        section="news",
    )

    return render_template("home.html", news_list=news_list)


@app.route("/articles")
def blog_posts():
    articles = add_slugs_to_articles(
        load_json_data(COFFEE_BREAK_SOURCE),
        url_prefix="/article",
        section="coffee-break",
    )

    return render_template("articles.html", articles=articles)


@app.route("/knowledge_vault")
def knowledge_vault():
    knowledge_vaults = add_slugs_to_articles(
        load_json_data(KNOWLEDGE_VAULT_SOURCE),
        url_prefix="/knowledge_vault",
        section="knowledge-vault",
    )

    return render_template(
        "knowledge_vault.html",
        knowledge_vaults=knowledge_vaults,
    )


@app.route("/story_time")
def story_time():
    story_time_articles = add_slugs_to_articles(
        load_json_data(STORY_TIME_SOURCE),
        url_prefix="/story_time",
        section="story-time",
    )

    for article in story_time_articles:
        article["image"] = resolve_story_time_image(
            article.get("image") or extract_first_image(article.get("article", ""))
        )

    return render_template(
        "story_time.html",
        story_time_articles=story_time_articles,
    )


@app.route("/news/<slug>")
def news_item_page(slug):
    news = archive_db.get_article_by_slug("news", slug)

    if news is None:
        abort(404)

    return render_template("news_item.html", news=news)


@app.route("/article/<slug>")
def article_item_page(slug):
    article = archive_db.get_article_by_slug("coffee-break", slug)

    if article is None:
        abort(404)

    return render_template("article_item.html", article=article)


@app.route("/knowledge_vault/<slug>")
def knowledge_item_page(slug):
    knowledge = archive_db.get_article_by_slug("knowledge-vault", slug)

    if knowledge is None:
        abort(404)

    return render_template("knowledge_item.html", knowledge=knowledge)


@app.route("/story_time/<slug>")
def story_item_page(slug):
    article = archive_db.get_article_by_slug("story-time", slug)

    if article is None:
        abort(404)

    article["image"] = article.get("image_local_path") or extract_first_image(
        article.get("article", "")
    )
    article["article"] = resolve_story_time_article_images(article.get("article", ""))

    return render_template("story_item.html", article=article)


@app.route("/sitemap.xml")
def sitemap():
    base_url = request.url_root.rstrip("/")
    rows = archive_db.sitemap_rows(limit=5000)

    section_url_prefix = {
        "news": "/news",
        "coffee-break": "/article",
        "knowledge-vault": "/knowledge_vault",
        "story-time": "/story_time",
    }

    urls = [
        f"""
        <url>
            <loc>{base_url}/</loc>
            <changefreq>daily</changefreq>
        </url>
        """,
        f"""
        <url>
            <loc>{base_url}/articles</loc>
            <changefreq>daily</changefreq>
        </url>
        """,
        f"""
        <url>
            <loc>{base_url}/knowledge_vault</loc>
            <changefreq>daily</changefreq>
        </url>
        """,
        f"""
        <url>
            <loc>{base_url}/story_time</loc>
            <changefreq>daily</changefreq>
        </url>
        """,
    ]

    for row in rows:
        prefix = section_url_prefix.get(row["section"])

        if not prefix:
            continue

        loc = f"{base_url}{prefix}/{row['slug']}"

        urls.append(
            f"""
            <url>
                <loc>{html.escape(loc)}</loc>
                <changefreq>monthly</changefreq>
            </url>
            """
        )

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        {''.join(urls)}
    </urlset>
    """

    return Response(xml, mimetype="application/xml")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/contact")
def contact():
    return render_template("contact.html")


@app.route("/privacy-policy")
def privacy_policy():
    return render_template("privacy_policy.html")


@app.route("/artifacts/<path:filename>")
def artifacts(filename):
    return send_from_directory(f"{ROOT}/artifacts", filename)


@app.route("/news-images/<path:filename>")
def news_images(filename):
    return send_from_directory(
        f"{DATA_DIR}/images",
        filename,
        max_age=60 * 60 * 24 * 30,
    )


@app.route("/llms.txt")
def llms_txt():
    return send_from_directory(
        f"{ROOT}/static",
        "llms.txt",
        mimetype="text/plain",
    )


if __name__ == "__main__":
    app.run(debug=True)
