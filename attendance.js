// --- DATA MANAGEMENT ---
let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let attendanceGoal = localStorage.getItem('attendanceGoal') || 75;

// --- GLOBAL DOM ELEMENTS ---
const subjectList = document.getElementById('subject-list');
const attendanceGoalInput = document.getElementById('attendanceGoal');
const subjectModal = document.getElementById('subjectModal');
const scheduleModal = document.getElementById('scheduleModal');

// --- UTILITY FUNCTIONS ---
function saveData() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('attendanceGoal', attendanceGoalInput.value);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    attendanceGoalInput.value = attendanceGoal;
    renderSubjects();
    renderSchedule();
    requestNotificationPermission();
    setInterval(checkAlarms, 60000); // Check for alarms every minute
});

attendanceGoalInput.addEventListener('change', () => {
    renderSubjects();
    saveData();
});

// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    const tabs = ['attendance', 'schedule'];
    tabs.forEach(tab => {
        document.getElementById(`content-${tab}`).classList.add('hidden');
        document.getElementById(`tab-${tab}`).classList.remove('tab-active', 'text-blue-600');
        document.getElementById(`tab-${tab}`).classList.add('text-slate-500');
    });
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('tab-active', 'text-blue-600');
    document.getElementById(`tab-${tabName}`).classList.remove('text-slate-500');
}

// --- MODAL CONTROLS ---
function openSubjectModal() {
    subjectModal.classList.remove('hidden');
    setTimeout(() => {
        subjectModal.classList.remove('opacity-0');
        subjectModal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeSubjectModal() {
    subjectModal.classList.add('opacity-0');
    subjectModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => subjectModal.classList.add('hidden'), 300);
}

// --- SUBJECT MANAGEMENT ---
function addSubject() {
    const subjectNameInput = document.getElementById('subjectName');
    const name = subjectNameInput.value.trim();
    if (name) {
        if (subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) {
            alert('A subject with this name already exists.');
            return;
        }
        subjects.push({ name: name, attended: 0, total: 0 });
        subjectNameInput.value = '';
        saveData();
        renderSubjects();
        closeSubjectModal();
    }
}

function removeSubject(index) {
    if (confirm(`Are you sure you want to delete "${subjects[index].name}"? This will also remove it from your schedule.`)) {
        const subjectNameToRemove = subjects[index].name;
        subjects.splice(index, 1);
        // Also remove from schedule
        schedule = schedule.filter(item => item.subject !== subjectNameToRemove);
        saveData();
        renderSubjects();
        renderSchedule();
    }
}

function updateAttendance(index, type) {
    if (type === 'attended') {
        subjects[index].attended++;
        subjects[index].total++;
    } else if (type === 'missed') {
        subjects[index].total++;
    }
    saveData();
    renderSubjects();
}

function resetAttendance(index) {
     if (confirm(`Are you sure you want to reset attendance for "${subjects[index].name}"?`)) {
        subjects[index].attended = 0;
        subjects[index].total = 0;
        saveData();
        renderSubjects();
    }
}

function renderSubjects() {
    subjectList.innerHTML = '';
    const noSubjectsMessage = document.getElementById('no-subjects-message');

    if (subjects.length === 0) {
        noSubjectsMessage.classList.remove('hidden');
        return;
    }
    noSubjectsMessage.classList.add('hidden');

    subjects.forEach((subject, index) => {
        const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
        const goal = parseFloat(attendanceGoalInput.value);

        let statusMessage = '';
        let statusColorClass = '';

        if (subject.total === 0) {
            statusMessage = "No classes held yet. Start tracking!";
            statusColorClass = 'text-slate-500';
        } else if (percentage >= goal) {
            const canMiss = Math.floor((subject.attended * 100 / goal) - subject.total);
            statusMessage = canMiss > 0 ? `You can miss the next ${canMiss} class(es).` : 'On track. Do not miss the next class.';
            statusColorClass = 'text-green-600';
        } else {
            const needToAttend = Math.ceil((goal * subject.total - 100 * subject.attended) / (100 - goal));
            statusMessage = `You need to attend the next ${needToAttend} class(es) to reach your goal.`;
            statusColorClass = 'text-red-600';
        }

        const card = document.createElement('div');
        card.className = 'p-5 border border-slate-200 rounded-xl shadow-sm';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                    <h3 class="text-xl font-bold text-slate-800">${subject.name}</h3>
                    <p class="text-sm text-slate-500 mt-1">Attended: <strong>${subject.attended}</strong> out of <strong>${subject.total}</strong> classes.</p>
                </div>
                <div class="mt-4 md:mt-0 flex items-center space-x-4">
                    <div class="text-right">
                        <p class="text-2xl font-semibold ${percentage >= goal ? 'text-green-500' : 'text-orange-500'}">${percentage.toFixed(1)}%</p>
                        <p class="text-xs text-slate-400">Goal: ${goal}%</p>
                    </div>
                    <button onclick="removeSubject(${index})" class="text-slate-400 hover:text-red-500 transition-colors"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                <div class="bg-${percentage >= goal ? 'green' : 'orange'}-500 h-2.5 rounded-full" style="width: ${percentage}%"></div>
            </div>
            <p class="text-sm mt-3 ${statusColorClass}">${statusMessage}</p>
            <div class="flex space-x-2 mt-4">
                <button onclick="updateAttendance(${index}, 'attended')" class="flex-1 bg-green-100 text-green-800 py-2 px-3 rounded-lg hover:bg-green-200 text-sm font-medium"><i class="fas fa-plus mr-1"></i> Attended</button>
                <button onclick="updateAttendance(${index}, 'missed')" class="flex-1 bg-red-100 text-red-800 py-2 px-3 rounded-lg hover:bg-red-200 text-sm font-medium"><i class="fas fa-minus mr-1"></i> Missed</button>
                <button onclick="resetAttendance(${index})" class="bg-slate-100 text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-200 text-sm font-medium"><i class="fas fa-undo"></i></button>
            </div>
        `;
        subjectList.appendChild(card);
    });
}

// --- FUNCTIONS FOR SCHEDULE ---
function openScheduleModal() {
    if (subjects.length === 0) {
        alert("Please add a subject first before adding a class to the schedule.");
        return;
    }
    const select = document.getElementById('scheduleSubject');
    select.innerHTML = ''; // Clear old options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        select.appendChild(option);
    });

    scheduleModal.classList.remove('hidden');
    setTimeout(() => {
        scheduleModal.classList.remove('opacity-0');
        scheduleModal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeScheduleModal() {
    scheduleModal.classList.add('opacity-0');
    scheduleModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => scheduleModal.classList.add('hidden'), 300);
}

function addScheduleItem() {
    const subject = document.getElementById('scheduleSubject').value;
    const day = document.getElementById('scheduleDay').value;
    const time = document.getElementById('scheduleTime').value;

    if (!subject || !day || !time) {
        alert('Please fill out all fields.');
        return;
    }

    schedule.push({ subject, day, time });
    saveData();
    renderSchedule();
    closeScheduleModal();
}

function removeScheduleItem(index) {
     if (confirm(`Are you sure you want to remove this class from the schedule?`)) {
        schedule.splice(index, 1);
        saveData();
        renderSchedule();
    }
}

function renderSchedule() {
    const scheduleBody = document.getElementById('schedule-body');
    const noScheduleMessage = document.getElementById('no-schedule-message');
    scheduleBody.innerHTML = '';

    if (schedule.length === 0) {
        noScheduleMessage.classList.remove('hidden');
        return;
    }
    noScheduleMessage.classList.add('hidden');

    // Sort schedule by day and time
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    schedule.sort((a, b) => {
        if (dayOrder.indexOf(a.day) !== dayOrder.indexOf(b.day)) {
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        }
        return a.time.localeCompare(b.time);
    });

    schedule.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${item.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.day}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.time}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="removeScheduleItem(${index})" class="text-red-500 hover:text-red-700">Remove</button>
            </td>
        `;
        scheduleBody.appendChild(row);
    });
}

// --- NOTIFICATION & ALARM LOGIC ---
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

function checkAlarms() {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
    const currentTime = now.toTimeString().substring(0, 5); // e.g., "14:30"

    schedule.forEach(item => {
        if (item.day === currentDay) {
            const [hours, minutes] = item.time.split(':');
            const classTime = new Date();
            classTime.setHours(hours, minutes, 0, 0);

            const alarmTime = new Date(classTime.getTime() - 5 * 60000); // 5 minutes before

            if (alarmTime.getHours() === now.getHours() && alarmTime.getMinutes() === now.getMinutes()) {
                sendNotification(item.subject, item.time);
            }
        }
    });
}

function sendNotification(subject, time) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('Upcoming Class!', {
            body: `${subject} class is starting at ${time}.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933251.png' // A generic bell icon
        });
    }
}