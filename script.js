// --- 1. ІНІЦІАЛІЗАЦІЯ ДАНИХ ---
let goldLibrary = JSON.parse(localStorage.getItem('goldLibrary')) || [];
let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
let currentlyReading = JSON.parse(localStorage.getItem('currentlyReading')) || [];
let dailyLogs = JSON.parse(localStorage.getItem('dailyLogs')) || {};

let activeTimers = {};

function formatTime(totalSeconds) {
    if (!totalSeconds) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// --- 2. ЛОГІКА СПИСКУ "ЗАРАЗ ЧИТАЮ" ---
function displayReadingList() {
    const container = document.getElementById('reading-list-container');
    if (!container) return;
    container.innerHTML = "";

    currentlyReading.forEach((book, index) => {
        if (book.timeSpent === undefined) book.timeSpent = 0;

        if (book.isRunning && !activeTimers[index]) {
            activeTimers[index] = setInterval(() => {
                const currentElapsed = Math.round((Date.now() - book.sessionStart) / 1000);
                const display = document.getElementById(`timer-display-${index}`);
                if (display) {
                    display.innerText = formatTime(book.timeSpent + currentElapsed);
                }
            }, 1000);
        }

        const isTimerRunning = book.isRunning;
        const btnText = isTimerRunning ? "⏸ Зупинити" : "▶ Почати";
        const btnBg = isTimerRunning ? "#cc0000" : "#d4af37";
        const btnColor = isTimerRunning ? "white" : "#121212";

        let displayTimeText = formatTime(book.timeSpent);
        if (isTimerRunning) {
            const currentElapsed = Math.round((Date.now() - book.sessionStart) / 1000);
            displayTimeText = formatTime(book.timeSpent + currentElapsed);
        }

        const percent = book.total > 0 ? Math.round((book.read / book.total) * 100) : 0;
        const displayPercent = percent > 100 ? 100 : percent;

        const card = document.createElement('div');
        card.className = 'reading-card';
        card.innerHTML = `
            <div class="cover-wrapper" onclick="triggerCardFileInput(${index})">
                <img src="${book.img || 'https://via.placeholder.com/150x220?text=Обкладинка'}" class="now-reading-img" id="cover-${index}">
                <input type="file" id="file-${index}" style="display:none" onchange="updateCardCover(this, ${index})">
                <div class="hover-hint">Змінити фото</div>
            </div>
            <div class="info">
                <h3 contenteditable="true" onblur="updateReadingData(${index}, 'title', this.innerText)">${book.title}</h3>
                <p>Автор: <span contenteditable="true" onblur="updateReadingData(${index}, 'author', this.innerText)">${book.author}</span></p>
                <div class="timer-section" style="display: flex; align-items: center; gap: 15px; margin: 10px 0; background: #2a2a2a; padding: 10px 15px; border-radius: 8px; border: 1px solid #444; flex-wrap: wrap;">
                    <span id="timer-display-${index}" style="font-family: monospace; font-size: 1.5rem; color: #d4af37; font-weight: bold; letter-spacing: 2px;">${displayTimeText}</span>
                    <button id="timer-btn-${index}" onclick="toggleTimer(${index})" style="background: ${btnBg}; color: ${btnColor}; padding: 8px 15px; font-size: 0.9rem; margin: 0; width: 120px;">${btnText}</button>
                    <button onclick="resetTimer(${index})" style="background: transparent; color: #888; border: 1px solid #555; padding: 8px 15px; font-size: 0.9rem; border-radius: 5px; cursor: pointer;">↺ Скинути</button>
                </div>
                <div class="pages-calc">
                    <input type="number" value="${book.total}" placeholder="Всього" oninput="updateReadingData(${index}, 'total', this.value)">
                    <input type="number" value="${book.read}" placeholder="Прочитано" oninput="updateReadingData(${index}, 'read', this.value)">
                    <button onclick="deleteReadingBook(${index})" style="background:none; border:none; color:#555; cursor:pointer; margin-left:10px; font-size:1.2rem;" title="Видалити книгу">×</button>
                </div>
                <div class="progress-bar">
                    <div id="progress-line-${index}" class="progress" style="width: ${displayPercent}%;">${displayPercent}%</div>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

function toggleTimer(index) {
    const btn = document.getElementById(`timer-btn-${index}`);
    const display = document.getElementById(`timer-display-${index}`);
    const book = currentlyReading[index];

    if (book.isRunning) {
        if (activeTimers[index]) { clearInterval(activeTimers[index]); delete activeTimers[index]; }
        btn.innerHTML = "▶ Почати";
        btn.style.background = "#d4af37";
        btn.style.color = "#121212";

        const sessionSeconds = Math.round((Date.now() - book.sessionStart) / 1000);
        const today = new Date().toISOString().split('T')[0];

        // ЗБЕРЕЖЕННЯ ФОТО В ІСТОРІЮ
        if (!dailyLogs[today]) dailyLogs[today] = {};
        if (!dailyLogs[today][book.title] || typeof dailyLogs[today][book.title] === 'number') {
            dailyLogs[today][book.title] = { time: dailyLogs[today][book.title] || 0, img: book.img || "" };
        }
        dailyLogs[today][book.title].time += sessionSeconds;
        dailyLogs[today][book.title].img = book.img; // Фото тепер тут назавжди

        localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));
        book.timeSpent += sessionSeconds;
        book.isRunning = false;
        localStorage.setItem('currentlyReading', JSON.stringify(currentlyReading));
        display.innerText = formatTime(book.timeSpent);
    } else {
        btn.innerHTML = "⏸ Зупинити";
        btn.style.background = "#cc0000";
        btn.style.color = "white";
        book.isRunning = true;
        book.sessionStart = Date.now();
        localStorage.setItem('currentlyReading', JSON.stringify(currentlyReading));
        activeTimers[index] = setInterval(() => {
            const currentElapsed = Math.round((Date.now() - book.sessionStart) / 1000);
            display.innerText = formatTime(book.timeSpent + currentElapsed);
        }, 1000);
    }
}

function resetTimer(index) {
    if (confirm("Ви впевнені?")) {
        if (activeTimers[index]) { clearInterval(activeTimers[index]); delete activeTimers[index]; }
        currentlyReading[index].timeSpent = 0;
        currentlyReading[index].isRunning = false;
        saveAndRefreshReading();
    }
}

function addNewReadingBook() {
    const titleInput = document.getElementById('new-reading-title');
    const authorInput = document.getElementById('new-reading-author');
    if (!titleInput.value.trim()) return;
    currentlyReading.push({
        title: titleInput.value.trim(),
        author: authorInput.value.trim() || "Невідомий автор",
        total: 100, read: 0, img: "", timeSpent: 0, isRunning: false
    });
    saveAndRefreshReading();
    titleInput.value = ""; authorInput.value = "";
}

function updateReadingData(index, field, val) {
    currentlyReading[index][field] = (field === 'total' || field === 'read') ? parseFloat(val) || 0 : val;
    localStorage.setItem('currentlyReading', JSON.stringify(currentlyReading));
    if (field === 'total' || field === 'read') displayReadingList();
}

function triggerCardFileInput(index) { document.getElementById(`file-${index}`).click(); }

function updateCardCover(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentlyReading[index].img = e.target.result;
            saveAndRefreshReading();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function deleteReadingBook(index) {
    if(confirm("Видалити книгу?")) {
        if (activeTimers[index]) { clearInterval(activeTimers[index]); delete activeTimers[index]; }
        currentlyReading.splice(index, 1);
        saveAndRefreshReading();
    }
}

function saveAndRefreshReading() {
    localStorage.setItem('currentlyReading', JSON.stringify(currentlyReading));
    displayReadingList();
}

function displayGoldShelf() {
    const shelf = document.getElementById('gold-shelf');
    if (!shelf) return;
    shelf.innerHTML = "";
    goldLibrary.forEach((book, index) => {
        const stars = "⭐".repeat(book.rating);
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        bookItem.innerHTML = `<div class="grid-cover-wrapper">
            <img src="${book.img}" class="grid-cover" onerror="this.src='https://via.placeholder.com/150x220?text=Обкладинка'">
            <button onclick="deleteGoldBook(${index})" class="del-gold-btn">×</button>
        </div><h4>${book.title}</h4><div class="gold-stars">${stars}</div>`;
        shelf.appendChild(bookItem);
    });
}

function addGoldBook() {
    const title = document.getElementById('gold-title');
    const url = document.getElementById('gold-url');
    const rating = document.getElementById('gold-rating');
    if (!title.value || !url.value) return;
    goldLibrary.push({ title: title.value, img: url.value, rating: parseInt(rating.value) });
    localStorage.setItem('goldLibrary', JSON.stringify(goldLibrary));
    displayGoldShelf();
    title.value = ""; url.value = "";
}

function deleteGoldBook(index) {
    if(confirm("Видалити?")) {
        goldLibrary.splice(index, 1);
        localStorage.setItem('goldLibrary', JSON.stringify(goldLibrary));
        displayGoldShelf();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('reading-list-container')) displayReadingList();
    if (document.getElementById('gold-shelf')) displayGoldShelf();
});

window.onscroll = () => {
    const btn = document.getElementById("scrollTopBtn");
    if (btn) btn.style.display = (window.scrollY > 200) ? "flex" : "none";
};

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
// УНІВЕРСАЛЬНИЙ ЕКСПОРТ: Зберігає все, що є в LocalStorage
function exportData() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            allData[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
            allData[key] = localStorage.getItem(key);
        }
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_bookish_world_FULL_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// УНІВЕРСАЛЬНИЙ ІМПОРТ: Відновлює абсолютно всі списки
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("Це оновить ВСІ твої списки (бібліотеку, плани, календар). Продовжити?")) {
                localStorage.clear(); // Очищаємо старе, щоб не було конфліктів
                for (const key in data) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                }
                alert("Усі дані (включаючи плани та бібліотеку) відновлено!");
                location.reload();
            }
        } catch (err) {
            alert("Помилка: файл пошкоджений.");
        }
    };
    reader.readAsText(file);
}