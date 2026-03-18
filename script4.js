// --- 5. ЛОГІКА КАЛЕНДАРЯ ЧИТАННЯ ---
let currentDate = new Date();

function getBookCover(title, dateStr) {
    // 1. Шукаємо в історії дня (для нових записів)
    if (dailyLogs[dateStr] && dailyLogs[dateStr][title] && dailyLogs[dateStr][title].img) {
        return dailyLogs[dateStr][title].img;
    }
    
    // 2. ДОДАНО: Якщо в історії за той день картинки немає, шукаємо її в активних книгах за назвою
    let activeBook = currentlyReading.find(b => b.title === title);
    if (activeBook && activeBook.img) return activeBook.img;
    
    // 3. Шукаємо в золотій колекції
    let goldBook = goldLibrary.find(b => b.title === title);
    if (goldBook && goldBook.img) return goldBook.img;
    
    return 'https://via.placeholder.com/30x45/333333/d4af37?text=📖';
}

function displayAnalytics() {
    const daysContainer = document.getElementById('calendar-days');
    const monthDisplay = document.getElementById('month-year-display');
    if (!daysContainer) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < startDay; i++) {
        html += `<div class="day-cell"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = dailyLogs[dateStr];

        let totalSeconds = 0;
        let mainBookTitle = "";
        let maxTime = 0;

        if (dayData) {
            for (const [title, data] of Object.entries(dayData)) {
                // Підтримка і старого формату (просто число) і нового (об'єкт)
                const time = (typeof data === 'object') ? data.time : data;
                totalSeconds += time;
                if (time > maxTime) {
                    maxTime = time;
                    mainBookTitle = title;
                }
            }
        }

        let colorClass = "";
        if (totalSeconds > 0 && totalSeconds < 600) colorClass = "color-1";
        else if (totalSeconds >= 600 && totalSeconds < 1800) colorClass = "color-2";
        else if (totalSeconds >= 1800 && totalSeconds < 3600) colorClass = "color-3";
        else if (totalSeconds >= 3600) colorClass = "color-4";

        let cellContent = '';
        if (totalSeconds > 0) {
            // Передаємо дату, щоб знайти саме те фото, яке було тоді
            const coverUrl = getBookCover(mainBookTitle, dateStr);
            const formattedTime = formatTime(totalSeconds);
            cellContent += `<img src="${coverUrl}" class="mini-cover" title="${mainBookTitle} (${formattedTime})">`;
        }
        cellContent += `<span class="day-number ${colorClass}">${day}</span>`;
        html += `<div class="day-cell">${cellContent}</div>`;
    }
    daysContainer.innerHTML = html;
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    displayAnalytics();
}

function clearAnalytics() {
    if (confirm("Видалити всю історію?")) {
        localStorage.removeItem('dailyLogs');
        dailyLogs = {};
        displayAnalytics();
    }
}

window.onload = () => displayAnalytics();