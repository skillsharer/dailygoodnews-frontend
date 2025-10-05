import bleach
from flask import Flask, render_template
import json
import re
import datetime
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

ROOT=os.path.dirname(os.path.dirname(__file__))
NEWS_SOURCE=f'{ROOT}/artifacts/news/news.json'
COFFEE_BREAK_SOURCE=f'{ROOT}/artifacts/coffee_break/coffee_break.json'
KNOWLEDGE_VAULT_SOURCE=f'{ROOT}/artifacts/knowledge_vault/knowledge_vault.json'
STORY_TIME_SOURCE=f'{ROOT}/artifacts/story_time/story_time.json'
app = Flask(__name__, template_folder=f'{ROOT}/templates', static_folder=f'{ROOT}/static')
GOOGLE_SITE_VERIFICATION=os.getenv('GOOGLE_SITE_VERIFICATION')

def slugify(text):
    slug = re.sub(r'[^a-zA-Z0-9-]', '', text.replace(' ', '-'))
    return slug.lower().strip('-')

def extract_first_image(html_string):
    """Extracts the src attribute of the first img tag in an HTML string."""
    match = re.search(r'<img.*?src="(.*?)"', html_string)  # Non-greedy match
    if match:
        return match.group(1)
    return None

def load_json_data(source_file):
    """Load JSON data from a file"""
    with open(source_file, "r") as jsonfile:
        return json.load(jsonfile)

def add_slugs_to_articles(articles):
    """Add slug field to each article for URL generation"""
    for article in articles:
        article['slug'] = slugify(article['heading'])
    return articles

#Bleach Sanitizer
def sanitize_html(value):
    allowed_tags = ['p', 'br', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'img', 'span']  # Added <span>
    allowed_attributes = {
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'style', 'class'],  # added class
        'div': ['style', 'class'],  # added class
        'p': ['style', 'class'],  # added class
        'span': ['style', 'class'], #Added span and classes
        'h1': ['style', 'class'],
        'h2': ['style', 'class'],
        'h3': ['style', 'class'],
        'h4': ['style', 'class'],
        'h5': ['style', 'class'],
        'h6': ['style', 'class'],
        'li': ['style', 'class'],
        'ul': ['style', 'class'],
        'ol': ['style', 'class']
    }
    allowed_protocols = ['http', 'https', 'data']
    return bleach.clean(value, tags=allowed_tags, attributes=allowed_attributes, protocols=allowed_protocols, strip=True)

app.jinja_env.filters['sanitize_html'] = sanitize_html
@app.context_processor
def inject_global_vars():
    return {
        'google_site_verification': GOOGLE_SITE_VERIFICATION,
        'now': datetime.datetime.now()
    }

@app.route('/')
def home():
    news_list = add_slugs_to_articles(load_json_data(NEWS_SOURCE))
    return render_template('home.html', news_list=news_list)

@app.route('/articles')
def blog_posts():
    articles = add_slugs_to_articles(load_json_data(COFFEE_BREAK_SOURCE))
    return render_template('articles.html', articles=articles)

@app.route('/knowledge_vault')
def knowledge_vault():
    knowledge_vaults = add_slugs_to_articles(load_json_data(KNOWLEDGE_VAULT_SOURCE))
    return render_template('knowledge_vault.html', knowledge_vaults=knowledge_vaults)

@app.route('/story_time')
def story_time():
    story_time_articles = add_slugs_to_articles(load_json_data(STORY_TIME_SOURCE))
    for article in story_time_articles:
        article['image'] = extract_first_image(article['article'])
    return render_template('story_time.html', story_time_articles=story_time_articles)

@app.route('/story_time/<story_id>')
def story_item_page(story_id):
    story_id = story_id.lower()
    story_articles = load_json_data(STORY_TIME_SOURCE)
    for article in story_articles:
        if slugify(article['heading']) == story_id:
            return render_template('story_item.html', article=article)
    return "Story not found", 404

@app.route('/article/<article_id>')
def article_item_page(article_id):
    article_id = article_id.lower()
    articles = load_json_data(COFFEE_BREAK_SOURCE)
    for article in articles:
        if slugify(article['heading']) == article_id:
            return render_template('article_item.html', article=article)
    return "Article not found", 404

@app.route('/knowledge_vault/<knowledge_id>')
def knowledge_item_page(knowledge_id):
    knowledge_id = knowledge_id.lower()
    knowledge_vaults = load_json_data(KNOWLEDGE_VAULT_SOURCE)
    for knowledge_article in knowledge_vaults:
        if slugify(knowledge_article['heading']) == knowledge_id:
            return render_template('knowledge_item.html', knowledge=knowledge_article)
    return "Article not found", 404

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/news/<news_id>')
def news_item_page(news_id):
    news_id = news_id.lower()
    news_list = load_json_data(NEWS_SOURCE)
    for news in news_list:
        if slugify(news['heading']) == news_id:
            return render_template('news_item.html', news=news)
    return "News item not found", 404

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@app.route('/artifacts/<path:filename>')
def artifacts(filename):
    from flask import send_from_directory
    return send_from_directory(f'{ROOT}/artifacts', filename)

if __name__ == '__main__':
    app.run(debug=True)