// --- 1. ІНІЦІАЛІЗАЦІЯ ДАНИХ ---
let goldLibrary = JSON.parse(localStorage.getItem('goldLibrary')) || [];
let myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
let currentlyReading = JSON.parse(localStorage.getItem('currentlyReading')) || [];
let dailyLogs = JSON.parse(localStorage.getItem('dailyLogs')) || {};

let perspectivePoints = [];
let activePointIndex = null;
let originalImage = null;

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

    // Вирівнюємо контейнер вліво, як було раніше
    container.style.justifyContent = "flex-start";

    currentlyReading.forEach((book, index) => {
        if (book.timeSpent === undefined) book.timeSpent = 0;

        if (book.isRunning && !activeTimers[index]) {
            activeTimers[index] = setInterval(() => {
                const currentElapsed = Math.round((Date.now() - book.sessionStart) / 1000);
                const display = document.getElementById(`timer-display-${index}`);
                if (display) display.innerText = formatTime(book.timeSpent + currentElapsed);
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
        card.style.margin = "0"; 

        card.innerHTML = `
            <div class="cover-wrapper" onclick="triggerCardFileInput(${index})">
                <img src="${book.img || 'https://via.placeholder.com/150x220?text=Обкладинка'}" class="now-reading-img" id="cover-${index}">
                <input type="file" id="file-${index}" style="display:none" onchange="updateCardCover(this, ${index})">
                <div class="hover-hint">Змінити фото</div>
            </div>
            <div class="info">
                <h3 contenteditable="true" onblur="updateReadingData(${index}, 'title', this.innerText)">${book.title}</h3>
                <p>Автор: <span contenteditable="true" onblur="updateReadingData(${index}, 'author', this.innerText)">${book.author}</span></p>
                
                <div class="timer-section" style="display: flex; align-items: center; gap: 10px; margin: 10px 0; background: #2a2a2a; padding: 10px 15px; border-radius: 8px; border: 1px solid #444;">
                    <span id="timer-display-${index}" style="font-family: monospace; font-size: 1.5rem; color: #d4af37; font-weight: bold;">${displayTimeText}</span>
                    <button id="timer-btn-${index}" onclick="toggleTimer(${index})" style="background: ${btnBg}; color: ${btnColor}; padding: 8px 12px; font-size: 0.9rem; margin: 0; border-radius: 5px; cursor: pointer;">${btnText}</button>
                    <button onclick="resetTimer(${index})" style="background: transparent; color: #888; border: 1px solid #555; padding: 8px 12px; font-size: 0.9rem; border-radius: 5px; cursor: pointer;">↺</button>
                    
                    <button onclick="openAddQuoteModal('${book.title.replace(/'/g, "\\'")}')" style="background: #2a2a2a; color: #d4af37; border: 1px solid #d4af37; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 1rem;">📝</button>
                </div>

                <div class="pages-calc" style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" value="${book.total}" placeholder="Всього" oninput="updateReadingData(${index}, 'total', this.value)" style="width: 80px; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 4px;">
                    <span style="color: #666;">/</span>
                    <input type="number" value="${book.read}" placeholder="Прочитано" oninput="updateReadingData(${index}, 'read', this.value)" style="width: 80px; padding: 8px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 4px;">
                    <button onclick="deleteReadingBook(${index})" style="background:none; border:none; color:#555; cursor:pointer; font-size:1.5rem;">×</button>
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
    const data = {
        currentlyReading: JSON.parse(localStorage.getItem('currentlyReading')) || [],
        myLibrary: JSON.parse(localStorage.getItem('myLibrary')) || [],
        tbrList: JSON.parse(localStorage.getItem('tbrList')) || [],
        goldLibrary: JSON.parse(localStorage.getItem('goldLibrary')) || [],
        dailyLogs: JSON.parse(localStorage.getItem('dailyLogs')) || {},
        allQuotes: JSON.parse(localStorage.getItem('allQuotes')) || {} // ДОДАЄМО ЦИТАТИ В ФАЙЛ
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_bookish_backup_${new Date().toLocaleDateString()}.json`;
    a.click();
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
// Структура даних: { "Назва Книги": [{page: 10, text: "..."}, ...] }
let allQuotes = JSON.parse(localStorage.getItem('allQuotes')) || {};

// ФУНКЦІЯ СКАНУВАННЯ (OCR)
let cropperInstance = null;

// 1. Коли ти вибираєш фото, відкривається редактор
// 1. Коли ти вибираєш фото, відкривається редактор з високою чіткістю
async function handleQuoteScan(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const oldCropper = document.getElementById('perspective-modal');
        if (oldCropper) oldCropper.remove();

        const modal = document.createElement('div');
        modal.className = 'cropper-modal-overlay';
        modal.id = 'perspective-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:10000; padding:10px; box-sizing:border-box;';
        
        modal.innerHTML = `
            <div style="position:relative; width:100%; display:flex; justify-content:center; overflow:hidden;">
                <canvas id="perspective-canvas" style="border:1px solid #d4af37; touch-action: none;"></canvas>
            </div>
            <p style="color:#d4af37; margin:10px 0; font-size:0.9rem; font-weight:bold;">Тягни за кути, щоб виділити текст</p>
            <div style="display:flex; gap:15px; width:100%; max-width:400px;">
                <button onclick="document.getElementById('perspective-modal').remove()" style="flex:1; padding:15px; background:#444; color:white; border:none; border-radius:12px; font-weight:bold;">❌</button>
                <button id="start-scan-btn" style="flex:2; padding:15px; background:#d4af37; color:black; border:none; border-radius:12px; font-weight:bold; font-size:1rem;">✅ Сканувати</button>
            </div>
        `;
        document.body.appendChild(modal);

        const canvas = document.getElementById('perspective-canvas');
        const ctx = canvas.getContext('2d');
        originalImage = new Image();
        originalImage.src = e.target.result;

        originalImage.onload = function() {
            // КОЕФІЦІЄНТ ТА DPR ДЛЯ ЧІТКОСТІ
            const dpr = window.devicePixelRatio || 1;
            const displayWidth = window.innerWidth - 40;
            const displayHeight = window.innerHeight * 0.7;
            const ratio = Math.min(displayWidth / originalImage.width, displayHeight / originalImage.height);

            const w = originalImage.width * ratio;
            const h = originalImage.height * ratio;

            // Налаштування реальних пікселів Canvas
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            ctx.scale(dpr, dpr);
            ctx.imageSmoothingEnabled = false; // Вимикаємо замилювання

            // Початкові точки
            perspectivePoints = [
                {x: w * 0.1, y: h * 0.1},
                {x: w * 0.9, y: h * 0.1},
                {x: w * 0.9, y: h * 0.9},
                {x: w * 0.1, y: h * 0.9}
            ];

            drawPerspectiveFrame(canvas, ctx);
            setupCanvasEvents(canvas, ctx);
            
            document.getElementById('start-scan-btn').onclick = () => processPerspectiveCrop(canvas);
        };
    };
    reader.readAsDataURL(file);
}

// 2. Функція малювання рамки (підтримує DPR)
function drawPerspectiveFrame(canvas, ctx) {
    const w = parseFloat(canvas.style.width);
    const h = parseFloat(canvas.style.height);
    
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);

    // Малюємо напівпрозору маску навколо виділення
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(w,0); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
    ctx.moveTo(perspectivePoints[0].x, perspectivePoints[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(perspectivePoints[i].x, perspectivePoints[i].y);
    ctx.closePath();
    ctx.fill("evenodd");

    // Малюємо золоту рамку
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(perspectivePoints[0].x, perspectivePoints[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(perspectivePoints[i].x, perspectivePoints[i].y);
    ctx.closePath();
    ctx.stroke();

    // Малюємо великі точки для зручності пальців
    perspectivePoints.forEach(p => {
        ctx.fillStyle = "white";
        ctx.shadowBlur = 10; ctx.shadowColor = "black";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#d4af37";
        ctx.stroke();
    });
}

// 3. Сама обробка (бере пікселі з оригінального фото)
async function processPerspectiveCrop(canvas) {
    const status = document.getElementById('scan-status');
    const textArea = document.getElementById('quote-text');
    if (status) status.innerHTML = "🔍 <b>Максимальна якість... Сканую...</b>";

    const dpr = window.devicePixelRatio || 1;
    const scaleX = originalImage.naturalWidth / parseFloat(canvas.style.width);
    const scaleY = originalImage.naturalHeight / parseFloat(canvas.style.height);
    
    const pts = perspectivePoints.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));

    // Створюємо Canvas для OCR (збільшуємо для кращого розпізнавання)
    const finalW = Math.max(Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), Math.hypot(pts[2].x - pts[3].x, pts[2].y - pts[3].y)) * 1.2;
    const finalH = Math.max(Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y), Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y)) * 1.2;

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = finalW;
    resultCanvas.height = finalH;
    const resCtx = resultCanvas.getContext('2d', { alpha: false });

    const minX = Math.min(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxX = Math.max(...pts.map(p => p.x));
    const maxY = Math.max(...pts.map(p => p.y));

    resCtx.imageSmoothingEnabled = false;
    resCtx.drawImage(originalImage, minX, minY, maxX - minX, maxY - minY, 0, 0, finalW, finalH);

    // Фільтр чіткості
    // --- ПОВНІСТЮ ОНОВЛЕНИЙ ФІЛЬТР ЧІТКОСТІ ---
    let imageData = resCtx.getImageData(0, 0, finalW, finalH);
    let data = imageData.data;
    
    // Спершу робимо копію для розрахунку середньої яскравості
    let grayscale = new Uint8Array(finalW * finalH);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }

    // Застосовуємо фільтр: робимо текст жирнішим і прибираємо сірі тіні
    for (let i = 0; i < data.length; i += 4) {
        let val = grayscale[i / 4];
        // Якщо піксель темніший за "сірий" (130) — робимо його чорним, інакше — білим
        // Ми трохи занижуємо поріг, щоб літери не "розсипалися"
        let final = val < 130 ? 0 : 255; 
        data[i] = data[i+1] = data[i+2] = final;
    }
    resCtx.putImageData(imageData, 0, 0);

    resultCanvas.toBlob(async (blob) => {
        document.getElementById('perspective-modal').remove();
        try {
            const worker = await Tesseract.createWorker('ukr');
            await worker.setParameters({
                tessedit_pageseg_mode: '1', // Автоматична сегментація сторінки
                tessedit_ocr_engine_mode: '1', // Використовувати LSTM (нейронну мережу)
                // Додаємо лише ті символи, які реально є в книгах
                tessedit_char_whitelist: 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789.,!?-—":;()«» '
            });

            const { data: { text } } = await worker.recognize(blob);
            await worker.terminate();

            textArea.value = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            if (status) status.innerText = "✨ Готово!";
        } catch (err) {
            if (status) status.innerText = "❌ Помилка";
        }
    }, 'image/jpeg', 1.0);
}

function setupCanvasEvents(canvas, ctx) {
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleStart = (e) => {
        const pos = getPos(e);
        activePointIndex = perspectivePoints.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) < 25);
    };

    const handleMove = (e) => {
        if (activePointIndex === null) return;
        e.preventDefault();
        perspectivePoints[activePointIndex] = getPos(e);
        drawPerspectiveFrame(canvas, ctx);
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', () => activePointIndex = null);
    
    canvas.addEventListener('touchstart', handleStart, {passive: false});
    canvas.addEventListener('touchmove', handleMove, {passive: false});
    window.addEventListener('touchend', () => activePointIndex = null);
}



function closeCropper() {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    const modal = document.getElementById('cropper-modal');
    if (modal) modal.remove();
}

// Функція збереження цитати (переконайся, що вона така)
function saveAndCloseQuote(title) {
    const page = document.getElementById('quote-page').value;
    const text = document.getElementById('quote-text').value;
    
    if (!page || !text) {
        alert("Заповни сторінку та текст!");
        return;
    }
    
    if (!allQuotes[title]) allQuotes[title] = [];
    allQuotes[title].push({ page, text });
    
    localStorage.setItem('allQuotes', JSON.stringify(allQuotes));
    alert("Цитату збережено!");
    document.querySelector('.add-quote-modal').remove();
}

// РЕНДЕР ГАЛЕРЕЇ (на сторінці quotes.html)
function renderQuotesGallery() {
    const container = document.getElementById('quotes-gallery');
    if (!container) return;
    container.innerHTML = "";

    // 1. Завантажуємо збережені цитати
    const quotesData = JSON.parse(localStorage.getItem('allQuotes')) || {};
    const titlesWithQuotes = Object.keys(quotesData);

    if (titlesWithQuotes.length === 0) {
        container.innerHTML = "<p style='color: #666; text-align: center; width: 100%; margin-top: 50px;'>Цитат поки немає. Додай першу на головній сторінці! 📖</p>";
        return;
    }

    // 2. Збираємо ВСІ книги з усіх списків в один масив для пошуку обкладинок
    const current = JSON.parse(localStorage.getItem('currentlyReading')) || [];
    const library = JSON.parse(localStorage.getItem('myLibrary')) || [];
    const tbr = JSON.parse(localStorage.getItem('tbrList')) || []; // План на майбутнє
    const gold = JSON.parse(localStorage.getItem('goldLibrary')) || []; // Золота полиця

    const allMyBooks = [...current, ...library, ...tbr, ...gold];

    // 3. Створюємо картки для кожної назви, де є цитати
    titlesWithQuotes.forEach(title => {
        // Шукаємо книгу в загальному масиві за назвою
        const bookData = allMyBooks.find(b => b.title.trim().toLowerCase() === title.trim().toLowerCase());
        
        // Визначаємо обкладинку: або з книги, або стандартна заглушка
        const img = (bookData && bookData.img) ? bookData.img : 'https://via.placeholder.com/150x220?text=Обкладинка';

        const card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = () => showBookQuotes(title);
        
        card.innerHTML = `
            <div class="book-cover-wrapper">
                <img src="${img}" alt="${title}">
                <div class="quote-count-badge">${quotesData[title].length}</div>
            </div>
            <p class="book-title-small">${title}</p>
        `;
        container.appendChild(card);
    });
}

function showBookQuotes(title) {
    const modal = document.getElementById('quote-modal');
    const list = document.getElementById('quotes-list');
    document.getElementById('modal-book-title').innerText = title;
    
    if (!allQuotes[title] || allQuotes[title].length === 0) {
        list.innerHTML = "<p style='color: #666;'>Цитат більше немає.</p>";
        return;
    }

    list.innerHTML = allQuotes[title].map((q, index) => `
        <div class="quote-item" style="position: relative; border-left: 3px solid #d4af37; background: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 15px; border-radius: 4px;">
            <span class="quote-page" style="color: #d4af37; font-weight: bold; display: block; margin-bottom: 5px;">Сторінка ${q.page}</span>
            <p style="font-style: italic; margin: 0; padding-right: 30px; color: #ddd;">"${q.text}"</p>
            
            <button onclick="deleteSingleQuote('${title.replace(/'/g, "\\'")}', ${index})" 
                style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #555; cursor: pointer; font-size: 1.2rem; transition: 0.3s;">
                &times;
            </button>
        </div>
    `).join('');
    
    // ВАЖЛИВО: використовуємо flex для центрування
    modal.style.display = 'flex';
}

function closeQuotes() {
    document.getElementById('quote-modal').style.display = 'none';
}
function deleteSingleQuote(title, index) {
    if (!confirm("Видалити цю цитату?")) return;

    // Видаляємо цитату з масиву за її номером (index)
    allQuotes[title].splice(index, 1);

    // Якщо у книги більше не залишилося цитат — видаляємо саму книгу з об'єкта
    if (allQuotes[title].length === 0) {
        delete allQuotes[title];
    }

    // Зберігаємо оновлені дані в пам'ять
    localStorage.setItem('allQuotes', JSON.stringify(allQuotes));

    // Оновлюємо інтерфейс: спочатку список у відкритому вікні, потім галерею на фоні
    showBookQuotes(title);
    if (allQuotes[title] === undefined) {
        // Якщо книга зникла, закриваємо модалку і оновлюємо галерею
        closeQuotes();
    }
    renderQuotesGallery();
}

// Функція для закриття вікна (про всяк випадок, якщо її немає)
function closeQuotes() {
    const modal = document.getElementById('quote-modal');
    if (modal) modal.style.display = 'none';
}
function openAddQuoteModal(bookTitle) {
    // Видаляємо старе вікно, якщо воно раптом залишилося
    const oldModal = document.querySelector('.add-quote-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'add-quote-modal';
    
    // Стилі для центрування
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; justify-content:center; align-items:center; z-index:9999; padding:20px;';
    
    modal.innerHTML = `
        <div style="background:#1a1a1a; padding:25px; border:1px solid #d4af37; border-radius:15px; width:100%; max-width:400px; text-align:center; position:relative;">
            <h3 style="color:#d4af37; margin-top:0;">📝 Нова цитата</h3>
            <p style="color:#888; font-size:0.8rem; margin-bottom:15px;">${bookTitle}</p>
            
            <input type="number" id="quote-page" placeholder="№ Сторінки" style="width:100%; padding:10px; margin-bottom:10px; background:#2a2a2a; color:white; border:1px solid #444; border-radius:8px;">
            
            <textarea id="quote-text" placeholder="Текст цитати з'явиться тут..." style="width:100%; height:120px; padding:10px; margin-bottom:15px; background:#2a2a2a; color:white; border:1px solid #444; border-radius:8px; font-family:serif; resize:none;"></textarea>
            
            <div id="scan-status" style="font-size:0.8rem; color:#d4af37; margin-bottom:15px; min-height:1.2rem;"></div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button onclick="document.getElementById('hidden-scan-input').click()" style="background:#2a2a2a; color:#d4af37; border:1px solid #d4af37; padding:12px; border-radius:8px; cursor:pointer;">📷 Скан</button>
                <button onclick="saveAndCloseQuote('${bookTitle.replace(/'/g, "\\'")}')" style="background:#d4af37; color:black; padding:12px; border-radius:8px; font-weight:bold; border:none; cursor:pointer;">💾 Зберегти</button>
            </div>
            
            <button onclick="this.closest('.add-quote-modal').remove()" style="margin-top:20px; background:none; border:none; color:#555; text-decoration:underline; cursor:pointer;">Скасувати</button>
            
            <input type="file" id="hidden-scan-input" accept="image/*" capture="camera" style="display:none;" onchange="handleQuoteScan(this.files[0])">
        </div>
    `;
    document.body.appendChild(modal);
}
// Функція для відкриття модалки з вибором книги
function openAddReadingBookModal() {
    const library = JSON.parse(localStorage.getItem('myLibrary')) || [];
    const tbr = JSON.parse(localStorage.getItem('tbrList')) || [];
    const gold = JSON.parse(localStorage.getItem('goldLibrary')) || [];
    
    const allExistingBooks = [...library, ...tbr, ...gold];
    const uniqueBooks = Array.from(new Map(allExistingBooks.map(item => [item.title, item])).values());

    const modal = document.createElement('div');
    modal.className = 'add-quote-modal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; justify-content:center; align-items:center; z-index:9999; padding:20px; box-sizing:border-box;';
    
    modal.innerHTML = `
        <div style="background:#1a1a1a; padding:25px; border:1px solid #d4af37; border-radius:15px; width:100%; max-width:400px; text-align:center; box-sizing:border-box;">
            <h3 style="color:#d4af37; margin-top:0;">📖 Додати в "Читаю зараз"</h3>
            
            <div id="book-preview" style="margin-bottom:15px; display:none;">
                <img id="preview-img" src="" style="width:80px; height:120px; object-fit:cover; border-radius:5px; border:1px solid #d4af37;">
            </div>

            <p style="color:#888; font-size:0.8rem; margin-bottom:10px;">Почни вводити назву або впиши нову:</p>
            
            <input type="text" id="new-reading-title" list="books-list" placeholder="Назва книги..." 
                oninput="checkExistingBook(this.value)" 
                style="width:100%; padding:12px; margin-bottom:10px; background:#2a2a2a; color:white; border:1px solid #444; border-radius:8px; outline:none; box-sizing:border-box;">
            
            <datalist id="books-list">
                ${uniqueBooks.map(b => `<option value="${b.title.replace(/"/g, '&quot;')}">`).join('')}
            </datalist>

            <input type="text" id="new-reading-author" placeholder="Автор" 
                style="width:100%; padding:12px; margin-bottom:20px; background:#2a2a2a; color:white; border:1px solid #444; border-radius:8px; outline:none; box-sizing:border-box;">
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button onclick="this.closest('.add-quote-modal').remove()" 
                    style="background:#444; color:white; padding:12px; border-radius:8px; border:none; cursor:pointer; font-weight:bold;">Скасувати</button>
                <button onclick="confirmAddReadingBook()" 
                    style="background:#d4af37; color:black; padding:12px; border-radius:8px; font-weight:bold; border:none; cursor:pointer;">Додати</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    window.currentAvailableBooks = uniqueBooks;
}

window.checkExistingBook = function(val) {
    const foundBook = window.currentAvailableBooks.find(b => b.title.toLowerCase() === val.toLowerCase());
    const authorInput = document.getElementById('new-reading-author');
    const titleInput = document.getElementById('new-reading-title');
    const previewDiv = document.getElementById('book-preview');
    const previewImg = document.getElementById('preview-img');

    if (foundBook) {
        authorInput.value = foundBook.author || "";
        titleInput.dataset.img = foundBook.img || "";
        
        if (foundBook.img) {
            previewImg.src = foundBook.img;
            previewDiv.style.display = "block";
        }
    } else {
        titleInput.dataset.img = "";
        previewDiv.style.display = "none";
    }
};

// ОСЬ ЦЯ ФУНКЦІЯ ПОВИННА БУТИ ТУТ:
function confirmAddReadingBook() {
    const title = document.getElementById('new-reading-title').value.trim();
    const author = document.getElementById('new-reading-author').value.trim();
    const img = document.getElementById('new-reading-title').dataset.img || "";

    if (!title) {
        alert("Введіть назву книги!");
        return;
    }

    // Додаємо нову книгу в масив
    currentlyReading.push({
        title: title,
        author: author || "Невідомий автор",
        total: 100,
        read: 0,
        img: img,
        timeSpent: 0,
        isRunning: false
    });

    // Зберігаємо та оновлюємо список на сторінці
    saveAndRefreshReading();
    
    // Закриваємо модалку
    const modal = document.querySelector('.add-quote-modal');
    if (modal) modal.remove();
}