from flask import Flask, request, jsonify
from flask_cors import CORS
from pony.orm import Database, Required, Optional, PrimaryKey, db_session, select
from datetime import datetime

app = Flask(__name__)
CORS(app)

db = Database()

class Book(db.Entity):
    _table_ = 'books'
    id       = PrimaryKey(int, auto=True)
    title    = Required(str)
    author   = Required(str)
    year     = Required(int)
    language = Required(str)
    genre    = Required(str)
    read     = Optional(bool, default=False)

db.bind(provider='sqlite', filename='library.db', create_db=True)
db.generate_mapping(create_tables=True)


# ── GET all books ──────────────────────────────────────────────
@app.route('/books', methods=['GET'])
@db_session
def get_books():
    books = select(b for b in Book).order_by(Book.id)[:]
    return jsonify([{
        'id':       b.id,
        'title':    b.title,
        'author':   b.author,
        'year':     b.year,
        'language': b.language,
        'genre':    b.genre,
        'read':     b.read
    } for b in books])


# ── POST create book ───────────────────────────────────────────
@app.route('/books', methods=['POST'])
@db_session
def create_book():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['title', 'author', 'year', 'language', 'genre']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'Missing field: {field}'}), 400

    book = Book(
        title    = data['title'],
        author   = data['author'],
        year     = int(data['year']),
        language = data['language'],
        genre    = data['genre'],
        read     = data.get('read', False)
    )
    db.flush()   # generates the id
    return jsonify({
        'id':       book.id,
        'title':    book.title,
        'author':   book.author,
        'year':     book.year,
        'language': book.language,
        'genre':    book.genre,
        'read':     book.read
    }), 201


# ── PUT update book ────────────────────────────────────────────
@app.route('/books/<int:book_id>', methods=['PUT'])
@db_session
def update_book(book_id):
    book = Book.get(id=book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'title'    in data: book.title    = data['title']
    if 'author'   in data: book.author   = data['author']
    if 'year'     in data: book.year     = int(data['year'])
    if 'language' in data: book.language = data['language']
    if 'genre'    in data: book.genre    = data['genre']
    if 'read'     in data: book.read     = bool(data['read'])

    return jsonify({
        'id':       book.id,
        'title':    book.title,
        'author':   book.author,
        'year':     book.year,
        'language': book.language,
        'genre':    book.genre,
        'read':     book.read
    })


# ── PATCH toggle read ──────────────────────────────────────────
@app.route('/books/<int:book_id>/read', methods=['PATCH'])
@db_session
def toggle_read(book_id):
    book = Book.get(id=book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    data = request.get_json()
    book.read = bool(data.get('read', not book.read))
    return jsonify({'id': book.id, 'read': book.read})


# ── DELETE book ────────────────────────────────────────────────
@app.route('/books/<int:book_id>', methods=['DELETE'])
@db_session
def delete_book(book_id):
    book = Book.get(id=book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    book.delete()
    return jsonify({'message': 'Book deleted'}), 200


# ── Health check ───────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
