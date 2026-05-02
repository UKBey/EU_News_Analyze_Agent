import hashlib


def generate_content_hash(title: str, link: str) -> str:
    """
    Generate a unique hash from title and link to prevent duplicate articles.
    """
    content = f"{title}|{link}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()
