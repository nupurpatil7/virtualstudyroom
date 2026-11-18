// Simple browser storage is used instead of a backend server.
function getData(key, fallback) {
  var value = localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
}
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function setupDemoData() {
  if (!localStorage.getItem('studyRooms')) {
    saveData('studyRooms', [
      { id: 1, name: 'Python Beginners', subject: 'Programming', description: 'Learn Python basics and solve simple coding questions.', members: 8, activity: 'Practice questions' },
      { id: 2, name: 'Mathematics Group', subject: 'Mathematics', description: 'Discuss calculus, algebra and problem solving.', members: 12, activity: 'Daily problem practice' },
      { id: 3, name: 'Web Development', subject: 'Web Design', description: 'Study HTML, CSS and JavaScript together.', members: 6, activity: 'Build a basic webpage' }
    ]);
  }
  if (!localStorage.getItem('studyResources')) {
    saveData('studyResources', [
      { title: 'HTML Notes', category: 'Web Design', description: 'Basic HTML tags and page structure.', addedBy: 'Admin' },
      { title: 'Python Practice', category: 'Programming', description: 'Beginner level Python practice questions.', addedBy: 'Admin' },
      { title: 'Calculus Revision', category: 'Mathematics', description: 'Important formulas for revision.', addedBy: 'Admin' }
    ]);
  }
}
setupDemoData();

function registerUser(event) {
  event.preventDefault();
  var users = getData('studyUsers', []);
  var name = document.getElementById('name').value.trim();
  var email = document.getElementById('email').value.trim().toLowerCase();
  var password = document.getElementById('password').value;
  if (users.some(function(user) { return user.email === email; })) {
    alert('This email is already registered.'); return;
  }
  users.push({ name: name, email: email, password: password, role: 'student', joined: [] });
  saveData('studyUsers', users);
  alert('Registration successful. Please log in.');
  window.location.href = 'login.html';
}
function loginUser(event) {
  event.preventDefault();
  var email = document.getElementById('email').value.trim().toLowerCase();
  var password = document.getElementById('password').value;
  var users = getData('studyUsers', []);
  var user = users.find(function(item) { return item.email === email && item.password === password; });
  if (email === 'admin@studyroom.com' && password === 'admin123') {
    saveData('currentUser', { name: 'Administrator', email: email, role: 'admin', joined: [] });
    window.location.href = 'admin.html'; return;
  }
  if (!user) { alert('Incorrect email or password. Please register first.'); return; }
  saveData('currentUser', user);
  window.location.href = 'dashboard.html';
}
function currentUser() { return getData('currentUser', null); }
function requireLogin() {
  if (!currentUser()) { alert('Please log in first.'); window.location.href = 'login.html'; }
}
function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }
function showWelcome() {
  var user = currentUser();
  var element = document.getElementById('welcomeName');
  if (element && user) element.textContent = user.name;
}
function displayRooms() {
  var area = document.getElementById('roomList');
  if (!area) return;
  var rooms = getData('studyRooms', []);
  var search = document.getElementById('roomSearch');
  var category = document.getElementById('roomCategory');
  function draw() {
    var word = search ? search.value.toLowerCase() : '';
    var type = category ? category.value : 'All';
    var filtered = rooms.filter(function(room) {
      return (room.name.toLowerCase().includes(word) || room.description.toLowerCase().includes(word)) && (type === 'All' || room.subject === type);
    });
    area.innerHTML = '';
    if (filtered.length === 0) { area.innerHTML = '<p>No study rooms found.</p>'; return; }
    filtered.forEach(function(room) {
      var card = document.createElement('div'); card.className = 'card';
      card.innerHTML = '<h3>' + room.name + '</h3><span class="tag">' + room.subject + '</span><p>' + room.description + '</p><p class="small">' + room.members + ' members · ' + room.activity + '</p><a class="btn" href="room-details.html?id=' + room.id + '">View room</a>';
      area.appendChild(card);
    });
  }
  if (search) search.addEventListener('input', draw);
  if (category) category.addEventListener('change', draw);
  draw();
}
function joinRoom() {
  var user = currentUser(); if (!user) { alert('Please log in to join this room.'); window.location.href = 'login.html'; return; }
  var id = Number(new URLSearchParams(window.location.search).get('id'));
  var rooms = getData('studyRooms', []); var room = rooms.find(function(item) { return item.id === id; });
  if (!room) return;
  if (!user.joined) user.joined = [];
  if (user.joined.indexOf(id) !== -1) { alert('You have already joined this room.'); return; }
  user.joined.push(id); room.members++;
  saveData('studyRooms', rooms);
  var users = getData('studyUsers', []);
  var index = users.findIndex(function(item) { return item.email === user.email; });
  if (index !== -1) users[index] = user;
  saveData('studyUsers', users); saveData('currentUser', user);
  saveData('studyNotifications', getData('studyNotifications', []).concat([user.name + ' joined ' + room.name]));
  alert('You have joined the study room.'); location.reload();
}
function displayRoomDetails() {
  var area = document.getElementById('roomDetails'); if (!area) return;
  var id = Number(new URLSearchParams(window.location.search).get('id'));
  var room = getData('studyRooms', []).find(function(item) { return item.id === id; });
  if (!room) { area.innerHTML = '<p>Room not found. Please go back to study rooms.</p>'; return; }
  area.innerHTML = '<h2>' + room.name + '</h2><span class="tag">' + room.subject + '</span><p>' + room.description + '</p><p>Members: ' + room.members + '</p><p>Current activity: ' + room.activity + '</p><button onclick="joinRoom()">Join this room</button>';
  displayComments();
}
function addComment(event) {
  event.preventDefault(); var user = currentUser();
  if (!user) { alert('Please log in to comment.'); return; }
  var id = new URLSearchParams(window.location.search).get('id');
  var comments = getData('studyComments', []);
  comments.push({ roomId: id, name: user.name, message: document.getElementById('commentText').value.trim() });
  saveData('studyComments', comments); document.getElementById('commentText').value = ''; displayComments();
}
function displayComments() {
  var area = document.getElementById('comments'); if (!area) return;
  var id = new URLSearchParams(window.location.search).get('id');
  var comments = getData('studyComments', []).filter(function(item) { return item.roomId === id; });
  area.innerHTML = comments.length ? '' : '<p class="small">No comments yet.</p>';
  comments.forEach(function(item) { var p = document.createElement('p'); p.className = 'list-item'; p.textContent = item.name + ': ' + item.message; area.appendChild(p); });
}
function displayResources() {
  var area = document.getElementById('resourceList'); if (!area) return;
  var resources = getData('studyResources', []);
  area.innerHTML = '';
  resources.forEach(function(item) { var div = document.createElement('div'); div.className = 'card'; div.innerHTML = '<h3>' + item.title + '</h3><span class="tag">' + item.category + '</span><p>' + item.description + '</p><p class="small">Added by: ' + item.addedBy + '</p>'; area.appendChild(div); });
}
function addResource(event) {
  event.preventDefault(); var user = currentUser();
  if (!user || user.role !== 'admin') { alert('Only admin can add resources.'); return; }
  var resources = getData('studyResources', []);
  resources.push({ title: document.getElementById('resourceTitle').value.trim(), category: document.getElementById('resourceCategory').value, description: document.getElementById('resourceDescription').value.trim(), addedBy: user.name });
  saveData('studyResources', resources); alert('Study material added.'); location.reload();
}
function displayProfile() {
  var user = currentUser(); if (!user) { requireLogin(); return; }
  var name = document.getElementById('profileName'); if (name) name.textContent = user.name;
  var email = document.getElementById('profileEmail'); if (email) email.textContent = user.email;
  var count = document.getElementById('joinedCount'); if (count) count.textContent = (user.joined || []).length;
  var joinedArea = document.getElementById('joinedRooms');
  if (joinedArea) {
    var rooms = getData('studyRooms', []).filter(function(room) { return (user.joined || []).indexOf(room.id) !== -1; });
    joinedArea.innerHTML = rooms.length ? '' : '<p>You have not joined any rooms yet.</p>';
    rooms.forEach(function(room) { var p = document.createElement('p'); p.textContent = room.name; joinedArea.appendChild(p); });
  }
}
function displayAdmin() {
  var user = currentUser(); if (!user || user.role !== 'admin') { alert('Admin login required.'); window.location.href = 'login.html'; return; }
  var users = getData('studyUsers', []); var rooms = getData('studyRooms', []); var resources = getData('studyResources', []);
  document.getElementById('userCount').textContent = users.length;
  document.getElementById('roomCount').textContent = rooms.length;
  document.getElementById('resourceCount').textContent = resources.length;
  var list = document.getElementById('adminRooms'); list.innerHTML = '';
  rooms.forEach(function(room) { var p = document.createElement('p'); p.className = 'list-item'; p.textContent = room.name + ' (' + room.members + ' members)'; list.appendChild(p); });
  var notes = getData('studyNotifications', []); var noteArea = document.getElementById('notifications');
  noteArea.innerHTML = notes.length ? '' : '<p>No new activity.</p>';
  notes.slice(-5).reverse().forEach(function(note) { var p = document.createElement('p'); p.textContent = note; noteArea.appendChild(p); });
}
