import hashlib

def hash_data(data):
    return hashlib.sha256(data.encode('utf-8')).hexdigest()