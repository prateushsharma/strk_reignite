import random
import string

def get_uid(length=10):
    # Base62 characters: uppercase letters, lowercase letters, and digits
    base62_chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join(random.choice(base62_chars) for _ in range(length))