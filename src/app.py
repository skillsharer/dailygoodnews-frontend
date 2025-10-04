import bleach
from flask import Flask, render_template
import json
import re
import datetime
import os

ROOT=os.path.dirname(os.path.dirname(__file__))
NEWS_SOURCE=f'{ROOT}/artifacts/news/news.json'
COFFEE_BREAK_SOURCE=f'{ROOT}/artifacts/coffee_break/coffee_break.json'
KNOWLEDGE_VAULT_SOURCE=f'{ROOT}/artifacts/knowledge_vault/knowledge_vault.json'
STORY_TIME_SOURCE=f'{ROOT}/artifacts/story_time/story_time.json'
app = Flask(__name__, template_folder=f'{ROOT}/templates', static_folder=f'{ROOT}/static')


def slugify(text):
    slug = re.sub(r'[^a-zA-Z0-9-]', '', text.replace(' ', '-'))
    return slug.lower().strip('-')

def extract_first_image(html_string):
    """Extracts the src attribute of the first img tag in an HTML string."""
    match = re.search(r'<img.*?src="(.*?)"', html_string)  # Non-greedy match
    if match:
        return match.group(1)
    return None

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

@app.route('/')
def home():
    with open(NEWS_SOURCE, "r") as jsonfile:
        news_list = json.load(jsonfile)
        for news in news_list:
            news['slug'] = slugify(news['heading'])
    return render_template('home.html', news_list=news_list, now=datetime.datetime.now())

@app.route('/articles')
def blog_posts():
    with open(COFFEE_BREAK_SOURCE, "r") as jsonfile:
        articles = json.load(jsonfile)
        for article in articles:
            article['slug'] = slugify(article['heading'])
    return render_template('articles.html', articles=articles, now=datetime.datetime.now())

@app.route('/knowledge_vault')
def knowledge_vault():
    with open(KNOWLEDGE_VAULT_SOURCE, "r") as jsonfile:
        knowledge_vaults = json.load(jsonfile)
        for knowledge_vault in knowledge_vaults:
            knowledge_vault['slug'] = sanitize_html(slugify(knowledge_vault['heading']))
    return render_template('knowledge_vault.html', knowledge_vaults=knowledge_vaults, now=datetime.datetime.now())

@app.route('/story_time')
def story_time():
    with open(STORY_TIME_SOURCE, "r") as jsonfile:
        story_time_articles = json.load(jsonfile)
        for article in story_time_articles:
            article['slug'] = slugify(article['heading'])
            article['image'] = extract_first_image(article['article']) # Extract Image
    return render_template('story_time.html', story_time_articles=story_time_articles, now=datetime.datetime.now())

@app.route('/story_time/<story_id>')
def story_item_page(story_id):
    story_id = story_id.lower()
    with open(STORY_TIME_SOURCE, "r") as jsonfile:
        story_articles = json.load(jsonfile)

    for article in story_articles:
        if slugify(article['heading']) == story_id:
            return render_template('story_item.html', article=article, now=datetime.datetime.now())
    return "Story not found", 404

@app.route('/article/<article_id>')
def article_item_page(article_id):
    article_id = article_id.lower()
    with open(COFFEE_BREAK_SOURCE, "r") as jsonfile:
        articles = json.load(jsonfile)

    for article in articles:
        if slugify(article['heading']) == article_id:
            return render_template('article_item.html', article=article, now=datetime.datetime.now())
    return "Article not found", 404

@app.route('/knowledge_vault/<knowledge_id>')
def knowledge_item_page(knowledge_id):
    knowledge_id = knowledge_id.lower()
    with open(KNOWLEDGE_VAULT_SOURCE, "r") as jsonfile:
        knowledge_vaults = json.load(jsonfile)

    for knowledge_article in knowledge_vaults:
        if slugify(knowledge_article['heading']) == knowledge_id:
            return render_template('knowledge_item.html', knowledge=knowledge_article, now=datetime.datetime.now())
    return "Article not found", 404

@app.route('/about')
def about():
    return render_template('about.html', now=datetime.datetime.now())

@app.route('/contact')
def contact():
    return render_template('contact.html', now=datetime.datetime.now())

@app.route('/news/<news_id>')
def news_item_page(news_id):
    news_id = news_id.lower()
    with open(NEWS_SOURCE, "r") as jsonfile:
        news_list = json.load(jsonfile)

    for news in news_list:
        if slugify(news['heading']) == news_id:
            return render_template('news_item.html', news=news, now=datetime.datetime.now())
    return "News item not found", 404

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html', now=datetime.datetime.now())

@app.route('/artifacts/<path:filename>')
def artifacts(filename):
    from flask import send_from_directory
    return send_from_directory(f'{ROOT}/artifacts', filename)

if __name__ == '__main__':
    app.run(debug=True)