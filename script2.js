// --- Ініціалізація даних ---
let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];

// --- 1. ПРЕВ'Ю ТА ВІДОБРАЖЕННЯ ПОЛИЦІ ---
function displayBookshelf() {
    const shelf = document.getElementById('bookshelf-container');
    if (!shelf) return;
    shelf.innerHTML = "";

    myLibrary.forEach((book, index) => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book-card';
        bookDiv.innerHTML = `
            <img src="${book.img}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/130x200?text=No+Cover'">
            <div class="book-info">
                <strong>${book.title}</strong><br>${book.author}
                <br><button onclick="deleteBook(${index})" class="del-btn">Прибрати</button>
            </div>
        `;
        shelf.appendChild(bookDiv);
    });
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
}

function previewFromUrl() {
    const url = document.getElementById('book-image-url').value.trim();
    const preview = document.getElementById('preview-container');
    if (url) {
        preview.innerHTML = `<img src="${url}" style="width:70px; height:100px; margin-top:10px; border: 2px solid #d4af37; object-fit: cover;" onerror="this.innerHTML='URL невірний'">`;
    } else {
        preview.innerHTML = "";
    }
}

// --- 2. ДОДАВАННЯ КНИГИ ---
function addNewBook() {
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const imgUrl = document.getElementById('book-image-url').value.trim();

    if (!title || !author || !imgUrl) {
        alert("Заповніть всі поля! Скопіюйте 'Адресу зображення' з Google.");
        return;
    }

    myLibrary.push({ title, author, img: imgUrl });
    displayBookshelf();

    // Очищення
    document.getElementById('book-title').value = "";
    document.getElementById('book-author').value = "";
    document.getElementById('book-image-url').value = "";
    document.getElementById('preview-container').innerHTML = "";
}

function deleteBook(index) {
    if(confirm("Видалити книгу з полиці?")) {
        myLibrary.splice(index, 1);
        displayBookshelf();
    }
}

// --- 3. ЛОГІКА ГОЛОВНОЇ СТОРИНКИ (ПРОГРЕС) ---
function calculateProgress() {
    const total = document.getElementById('total-pages')?.value || 0;
    const read = document.getElementById('read-pages')?.value || 0;
    const progressBar = document.getElementById('progress-line');

    if (progressBar && total > 0) {
        let percentage = Math.round((read / total) * 100);
        if (percentage > 100) percentage = 100;
        progressBar.style.width = percentage + "%";
        progressBar.innerText = percentage + "%";
        saveCurrentBookData();
    }
}

function saveCurrentBookData() {
    const title = document.getElementById('display-title')?.innerText;
    if (!title) return;

    const data = {
        title: title,
        author: document.getElementById('display-author').innerText,
        total: document.getElementById('total-pages').value,
        read: document.getElementById('read-pages').value,
        today: document.getElementById('today-count').innerText
    };
    localStorage.setItem('nowReadingData', JSON.stringify(data));
}

// --- 4. РАНДОМАЙЗЕР ---
function getRandomBook() {
    const display = document.getElementById('result-display');
    if (myLibrary.length === 0) {
        display.innerText = "Додайте книги на полицю!";
        return;
    }
}

// Запуск при завантаженні
window.onload = function() {
    displayBookshelf();
    
    // Завантаження фото на головній, якщо воно було збережене
    const savedCover = localStorage.getItem('mainBookCover');
    if (savedCover && document.getElementById('main-cover')) {
        document.getElementById('main-cover').src = savedCover;
    }
};

// --- ЛОГІКА КНОПКИ "ВГОРУ" ---
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return; 
    
    // Показуємо кнопку, якщо прокрутили сторінку на 200 пікселів вниз
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        btn.style.display = "flex";  // Використовуємо flex для ідеального центрування
    } else {
        btn.style.display = "none";
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}