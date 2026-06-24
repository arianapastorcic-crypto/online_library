const API = 'http://localhost:5000';
 
const titleInput    = document.getElementById('title');
const authorInput   = document.getElementById('author');
const yearInput     = document.getElementById('year');
const languageInput = document.getElementById('language');
const genreInput    = document.getElementById('genre');
const bookList      = document.getElementById('book-list');
const btn           = document.querySelector('.btn');
 
let editingRow = null;
let editingId  = null;
 
// ── Submit (Add or Update) ─────────────────────────────────────
btn.addEventListener('click', async function (e) {
    e.preventDefault();
 
    const t = titleInput.value.trim();
    const a = authorInput.value.trim();
    const y = yearInput.value.trim();
    const l = languageInput.value.trim();
    const g = genreInput.value.trim();
 
    if (!t && !a && !y && !l && !g) {
        alert('Fill the form');
        return;
    }
 
    const payload = { title: t, author: a, year: y, language: l, genre: g };
 
    if (editingId !== null) {
        // UPDATE
        const res = await fetch(`${API}/books/${editingId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        if (!res.ok) { alert('Update failed'); return; }
        const updated = await res.json();
 
        const divs = editingRow.querySelectorAll('div.cell');
        divs[0].textContent = updated.title;
        divs[1].textContent = updated.author;
        divs[2].textContent = updated.year;
        divs[3].textContent = updated.language;
        divs[4].textContent = updated.genre;
 
        editingRow = null;
        editingId  = null;
        btn.textContent = 'Add Book';
        refreshFilterOptions();
 
    } else {
        // CREATE
        const res = await fetch(`${API}/books`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        if (!res.ok) { alert('Could not add book'); return; }
        const book = await res.json();
 
        const row = createRow(book);
        bookList.appendChild(row);
        refreshFilterOptions();
    }
 
    clearForm();
});
 
// ── Build a table row from a book object ───────────────────────
function createRow(book) {
    const row = document.createElement('section');
    row.dataset.id = book.id;
 
    ['title', 'author', 'year', 'language', 'genre'].forEach(field => {
        const div = document.createElement('div');
        div.classList.add('cell');
        div.textContent = book[field];
        row.appendChild(div);
    });
 
    if (book.read) row.classList.add('row-read');
 
    // ── Actions container ──────────────────────────────────────
    const actions = document.createElement('div');
    actions.classList.add('actions');
 
    // Read toggle
    const readLabel    = document.createElement('label');
    readLabel.classList.add('read-label');
 
    const readCheckbox = document.createElement('input');
    readCheckbox.type  = 'checkbox';
    readCheckbox.classList.add('read-checkbox');
    readCheckbox.checked = book.read || false;
 
    const toggleTrack = document.createElement('div');
    toggleTrack.classList.add('toggle-track');
 
    const readText = document.createElement('span');
    readText.textContent = 'Read';
 
    readCheckbox.addEventListener('change', async () => {
        const id  = row.dataset.id;
        const res = await fetch(`${API}/books/${id}/read`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ read: readCheckbox.checked })
        });
        if (res.ok) {
            row.classList.toggle('row-read', readCheckbox.checked);
        } else {
            readCheckbox.checked = !readCheckbox.checked; // revert on error
        }
    });
 
    readLabel.appendChild(readCheckbox);
    readLabel.appendChild(toggleTrack);
    readLabel.appendChild(readText);
 
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('action-btn', 'edit-btn');
    editBtn.addEventListener('click', () => {
        const divs = row.querySelectorAll('div.cell');
        titleInput.value    = divs[0].textContent;
        authorInput.value   = divs[1].textContent;
        yearInput.value     = divs[2].textContent;
        languageInput.value = divs[3].textContent;
        genreInput.value    = divs[4].textContent;
 
        editingRow = row;
        editingId  = row.dataset.id;
        btn.textContent = 'Update Book';
    });
 
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('action-btn', 'delete-btn');
    deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this book?')) return;
 
        const id  = row.dataset.id;
        const res = await fetch(`${API}/books/${id}`, { method: 'DELETE' });
        if (res.ok) {
            row.remove();
            refreshFilterOptions();
            applyFilters();
            if (editingId === id) {
                editingRow = null;
                editingId  = null;
                btn.textContent = 'Add Book';
                clearForm();
            }
        } else {
            alert('Delete failed');
        }
    });
 
    actions.appendChild(readLabel);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
 
    return row;
}
 
// ── Clear form inputs ──────────────────────────────────────────
function clearForm() {
    titleInput.value    = '';
    authorInput.value   = '';
    yearInput.value     = '';
    languageInput.value = '';
    genreInput.value    = '';
}
 
// ── Load books from backend on page load ───────────────────────
async function loadBooks() {
    try {
        const res   = await fetch(`${API}/books`);
        const books = await res.json();
        books.forEach(book => bookList.appendChild(createRow(book)));
        refreshFilterOptions();
    } catch (err) {
        console.error('Could not connect to backend:', err);
    }
}
 
// ── Modal close ────────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});
 
loadBooks();
 
// ── FILTERS ────────────────────────────────────────────────────
 
const filterGenre    = document.getElementById('filter-genre');
const filterLanguage = document.getElementById('filter-language');
const filterYear     = document.getElementById('filter-year');
const filterRead     = document.getElementById('filter-read');
const clearFiltersBtn = document.getElementById('clear-filters');
 
// Populate a <select> with unique values from all rows for a given cell index
function populateFilter(selectEl, cellIndex) {
    const current = selectEl.value;
    const values = new Set();
    bookList.querySelectorAll('section').forEach(row => {
        const cell = row.querySelectorAll('.cell')[cellIndex];
        if (cell) values.add(cell.textContent.trim());
    });
    // Keep first "all" option, rebuild the rest
    while (selectEl.options.length > 1) selectEl.remove(1);
    [...values].sort().forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        selectEl.appendChild(opt);
    });
    selectEl.value = current;
}
 
function refreshFilterOptions() {
    populateFilter(filterGenre,    4); // genre is cell index 4
    populateFilter(filterLanguage, 3); // language is cell index 3
    populateFilter(filterYear,     2); // year is cell index 2
}
 
function applyFilters() {
    const genre    = filterGenre.value;
    const language = filterLanguage.value;
    const year     = filterYear.value;
    const read     = filterRead.value;
 
    bookList.querySelectorAll('section').forEach(row => {
        const cells   = row.querySelectorAll('.cell');
        const isRead  = row.classList.contains('row-read');
 
        const matchGenre    = !genre    || cells[4]?.textContent.trim() === genre;
        const matchLanguage = !language || cells[3]?.textContent.trim() === language;
        const matchYear     = !year     || cells[2]?.textContent.trim() === year;
        const matchRead     = !read     ||
            (read === 'read'   && isRead) ||
            (read === 'unread' && !isRead);
 
        row.classList.toggle('hidden-row', !(matchGenre && matchLanguage && matchYear && matchRead));
    });
}
 
filterGenre.addEventListener('change',    applyFilters);
filterLanguage.addEventListener('change', applyFilters);
filterYear.addEventListener('change',     applyFilters);
filterRead.addEventListener('change',     applyFilters);
 
clearFiltersBtn.addEventListener('click', () => {
    filterGenre.value    = '';
    filterLanguage.value = '';
    filterYear.value     = '';
    filterRead.value     = '';
    applyFilters();
});
 