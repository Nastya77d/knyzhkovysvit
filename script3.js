let tbrLibrary = JSON.parse(localStorage.getItem('tbrLibrary')) || [];
let unreadLibrary = JSON.parse(localStorage.getItem('unreadLibrary')) || [];

function initPage() {
    renderShelf('tbr-container', tbrLibrary, 'tbr');
    renderShelf('unread-container', unreadLibrary, 'unread');
}

function renderShelf(containerId, dataArray, type) {
    const shelf = document.getElementById(containerId);
    if (!shelf) return;
    shelf.innerHTML = "";

    dataArray.forEach((book, index) => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book-card';
        
        let actionButton = "";
        if (type === 'tbr') {
            actionButton = `<button onclick="markAsRead(${index})" style="background:#27ae60; color:white; border:none; padding:5px 8px; border-radius:4px; margin-top:5px; cursor:pointer; width:100%;">✔️ Прочитано</button>`;
        } else {
            actionButton = `<button onclick="markAsBought(${index})" style="background:#2980b9; color:white; border:none; padding:5px 8px; border-radius:4px; margin-top:5px; cursor:pointer; width:100%;">🛒 Придбано</button>`;
        }

        bookDiv.innerHTML = `
            <img src="${book.img}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x220?text=No+Cover'">
            <div class="book-info">
                <strong>${book.title}</strong><br>
                <span>${book.author}</span><br>
                ${actionButton}
                <button onclick="deleteBook('${type}', ${index})" style="background:none; color:#cc0000; border:none; padding:3px; font-size: 0.8rem; margin-top:5px; cursor:pointer; text-decoration: underline;">Видалити зовсім</button>
            </div>
        `;
        shelf.appendChild(bookDiv);
    });
}

// --- ОНОВЛЕНА ЛОГІКА: "ПРИДБАНО" ТА "ПРОЧИТАНО" ---

function markAsBought(index) {
    // 1. Беремо книгу з полиці "Планую придбати"
    const book = unreadLibrary[index];
    
    // 2. Додаємо її в "Мою Бібліотеку" (щоб вона з'явилася на сторінці library.html)
    let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
    myLibrary.push({
        title: book.title,
        author: book.author,
        img: book.img
    });
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));

    // 3. ТАКОЖ автоматично переносимо її на полицю "Планую читати" (на цій же сторінці)
    tbrLibrary.push({
        title: book.title,
        author: book.author,
        img: book.img,
        shelf: 'tbr' // Вказуємо нову полицю
    });

    // 4. Видаляємо її зі списку покупок
    unreadLibrary.splice(index, 1); 
    saveData();
    
    alert("Книгу придбано! 📚 Вона додана до 'Моєї Бібліотеки' та переміщена на полицю 'Планую читати'.");
}

function markAsRead(index) {
    // Оскільки книга вже в Бібліотеці, ми просто видаляємо її з планів на читання
    tbrLibrary.splice(index, 1); 
    saveData(); 
    
    alert("Відмічено як прочитано! ✔️ Книга зникла з планів (але залишилась у Бібліотеці).");
}

// --- СТАНДАРТНІ ФУНКЦІЇ ДОДАВАННЯ ТА ВИДАЛЕННЯ ---

function previewImageFromUrl() {
    const url = document.getElementById('book-url').value;
    const preview = document.getElementById('preview-container');
    if (url) {
        preview.innerHTML = `<img src="${url}" style="width:70px; height:100px; margin-top:10px; border:2px solid #d4af37; object-fit:cover;" onerror="this.innerHTML='Невірне посилання'">`;
    } else {
        preview.innerHTML = "";
    }
}

function addNewBookToTBR() {
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const shelfType = document.getElementById('shelf-type').value;
    const imageUrl = document.getElementById('book-url').value.trim();

    if (!title || !author || !imageUrl) {
        alert("Заповніть назву, автора та посилання на фото!");
        return;
    }

    const newBook = { title, author, img: imageUrl, shelf: shelfType };

    if (shelfType === 'tbr') tbrLibrary.push(newBook);
    else unreadLibrary.push(newBook);

    saveData();
    clearForm();
}

function deleteBook(type, index) {
    if (confirm("Точно видалити цю книгу назавжди?")) {
        if (type === 'tbr') tbrLibrary.splice(index, 1);
        else unreadLibrary.splice(index, 1);
        saveData();
    }
}

function saveData() {
    localStorage.setItem('tbrLibrary', JSON.stringify(tbrLibrary));
    localStorage.setItem('unreadLibrary', JSON.stringify(unreadLibrary));
    initPage();
}

function clearForm() {
    document.getElementById('book-title').value = "";
    document.getElementById('book-author').value = "";
    document.getElementById('book-url').value = "";
    document.getElementById('preview-container').innerHTML = "";
}

window.onload = initPage;

// --- ЛОГІКА КНОПКИ "ВГОРУ" ---
window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const btn = document.getElementById("scrollTopBtn");
    if (!btn) return; 
    
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        btn.style.display = "flex";  
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

// --- РАНДОМАЙЗЕР ДЛЯ ПЛАНІВ ---
function getRandomBook() {
    const display = document.getElementById('result-display');
    if (!display) return;
    
    if (tbrLibrary.length === 0) {
        display.innerText = "Спочатку додай книги на полицю планів!";
        return;
    }
    
    display.innerText = "Обираю...";
    
    setTimeout(() => {
        const random = tbrLibrary[Math.floor(Math.random() * tbrLibrary.length)];
        display.innerText = "Твоя наступна історія: " + random.title;
    }, 500);
}