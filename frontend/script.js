// ─── Global state ─────────────────────────────────────────────
let uploadedFiles   = [];
let analysisResults = null;
let currentCandidate = null;

// ─── Page navigation ──────────────────────────────────────────
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (pageId === 'dashboard')                                   document.querySelectorAll('.nav-link')[0].classList.add('active');
    if (pageId === 'job-description' || pageId === 'resume-upload') document.querySelectorAll('.nav-link')[1].classList.add('active');
    if (pageId === 'analytics')                                   document.querySelectorAll('.nav-link')[2].classList.add('active');
}

// ─── Dark mode ────────────────────────────────────────────────
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.querySelector('.dark-toggle').textContent =
        document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// ─── Weight sliders ───────────────────────────────────────────
function updateWeights() {
    const textSim   = parseInt(document.getElementById('textSim').value);
    const skillMatch = parseInt(document.getElementById('skillMatch').value);
    const experience = parseInt(document.getElementById('experience').value);
    const education  = parseInt(document.getElementById('education').value);

    document.getElementById('textSimValue').textContent   = textSim   + '%';
    document.getElementById('skillMatchValue').textContent = skillMatch + '%';
    document.getElementById('experienceValue').textContent = experience + '%';
    document.getElementById('educationValue').textContent  = education  + '%';

    const total = textSim + skillMatch + experience + education;
    document.getElementById('totalWeight').textContent = total;

    const errorDiv = document.getElementById('weightError');
    if (total !== 100) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = `⚠️ Total: ${total}% (must be 100%)`;
    } else {
        errorDiv.style.display = 'none';
    }
}

// ─── File upload ──────────────────────────────────────────────
const resumeDropZone = document.getElementById('resumeDropZone');
const resumeFileInput = document.getElementById('resumeFileInput');
const fileList = document.getElementById('fileList');

resumeDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    resumeDropZone.classList.add('dragover');
});
resumeDropZone.addEventListener('dragleave', () => {
    resumeDropZone.classList.remove('dragover');
});
resumeDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resumeDropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
resumeFileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File too large: ' + file.name);
            return;
        }
        uploadedFiles.push(file);
        addFileCard(file);
    });
    document.getElementById('analyzeBtn').disabled = uploadedFiles.length < 2;
}

function addFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.innerHTML = `
        <div class="file-info">
            <div class="file-icon">📄</div>
            <div>
                <div style="font-weight:600">${file.name}</div>
                <div style="font-size:0.85rem;color:var(--gray)">${(file.size/1024).toFixed(1)} KB</div>
                <div class="progress-bar"><div class="progress-fill" style="width:100%"></div></div>
            </div>
        </div>
        <button class="btn btn-outline" onclick="removeFile('${file.name}')" style="padding:0.5rem 1rem">✕</button>
    `;
    fileList.appendChild(card);
}

function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
    fileList.innerHTML = '';
    uploadedFiles.forEach(f => addFileCard(f));
    document.getElementById('analyzeBtn').disabled = uploadedFiles.length < 2;
}

// ─── MAIN: Analyze resumes — calls real Flask backend ─────────
async function analyzeResumes() {
    if (uploadedFiles.length < 2) {
        showNotification('Please upload at least 2 resumes');
        return;
    }

    const total = parseInt(document.getElementById('totalWeight').textContent);
    if (total !== 100) {
        showNotification('Weights must total 100%');
        return;
    }

    showNotification('Analyzing candidates... Please wait');

    // Step 1: Read every uploaded file as plain text
    const resumePromises = uploadedFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({
                name: file.name.replace(/\.[^/.]+$/, ''),  // strip extension
                text: e.target.result
            });
            reader.readAsText(file);
        });
    });

    const resumes = await Promise.all(resumePromises);

    // Step 2: Build the JSON payload for Flask
    const payload = {
        job_description: document.getElementById('jobDescInput').value,
        resumes: resumes,
        weights: {
            text_similarity: parseInt(document.getElementById('textSim').value)   / 100,
            skill_match:     parseInt(document.getElementById('skillMatch').value) / 100,
            experience:      parseInt(document.getElementById('experience').value) / 100,
            education:       parseInt(document.getElementById('education').value)  / 100
        }
    };

    // Step 3: Send to Flask and get real AI results back
    try {
        const response = await fetch('http://127.0.0.1:5000/analyze', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            showNotification('Server error: ' + (err.error || response.status));
            return;
        }

        const results = await response.json();  // array from Python AI

        // Step 4: Map Python field names → JS field names used by displayResults()
        analysisResults = results.map(r => ({
            name:       r.Candidate,
            finalScore: r.Final_Score,
            textSim:    r.Text_Similarity,
            skillMatch: r.Skill_Match,
            experience: r.Experience_Score,
            education:  r.Education_Score
        }));

        displayResults(analysisResults);
        updateDashboardStats();
        showPage('results');
        showNotification('Analysis complete!');

    } catch (error) {
        // Network error — Flask is probably not running
        showNotification('Cannot reach server. Run: python App.py');
        console.error(error);
    }
}

// ─── Display results table ────────────────────────────────────
function displayResults(results) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="rank-badge">${index + 1}</span></td>
            <td><strong>${result.name}</strong></td>
            <td>
                <div class="score-bar">
                    <div class="score-fill" style="width:${result.finalScore}%">${result.finalScore}%</div>
                </div>
            </td>
            <td>${result.textSim}%</td>
            <td>${result.skillMatch}%</td>
            <td>${result.experience}%</td>
            <td>${result.education}%</td>
            <td><button class="btn btn-primary" onclick="viewCandidate(${index})" style="padding:0.5rem 1rem">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ─── Candidate detail page ────────────────────────────────────
function viewCandidate(index) {
    const candidate = analysisResults[index];
    currentCandidate = candidate;

    document.getElementById('candidateName').textContent   = candidate.name;
    document.getElementById('candidateAvatar').textContent = candidate.name.substring(0, 2).toUpperCase();
    document.getElementById('candidateScore').textContent  = candidate.finalScore + '%';

    // Badge based on real score
    const badge = document.getElementById('candidateBadge');
    if (candidate.finalScore >= 80) {
        badge.className   = 'recommendation-badge badge-excellent';
        badge.textContent = '⭐ Highly Recommended';
    } else if (candidate.finalScore >= 60) {
        badge.className   = 'recommendation-badge badge-good';
        badge.textContent = '✓ Recommended';
    } else {
        badge.className   = 'recommendation-badge badge-review';
        badge.textContent = '⚠ Needs Review';
    }

    // Score bars
    const setBar = (id, barId, value) => {
        document.getElementById(id).textContent      = value + '%';
        document.getElementById(barId).style.width   = value + '%';
        document.getElementById(barId).textContent   = value + '%';
    };
    setBar('detailTextSim',   'detailTextSimBar',   candidate.textSim);
    setBar('detailSkillMatch','detailSkillMatchBar', candidate.skillMatch);
    setBar('detailExperience','detailExperienceBar', candidate.experience);
    setBar('detailEducation', 'detailEducationBar',  candidate.education);

    // Skills shown are from the real AI (these are extracted by Python)
    // For now show generic tags — you can extend this later
    const techSkills = ['Python','Machine Learning','TensorFlow','NLP','Docker','AWS'];
    const softSkills = ['Leadership','Communication','Problem Solving','Teamwork'];

    document.getElementById('technicalSkills').innerHTML =
        techSkills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    document.getElementById('softSkills').innerHTML =
        softSkills.map(s => `<span class="skill-tag">${s}</span>`).join('');

    showPage('candidate-detail');
}

// ─── Dashboard stats ──────────────────────────────────────────
function updateDashboardStats() {
    if (!analysisResults) return;
    document.getElementById('totalResumes').textContent      = analysisResults.length;
    document.getElementById('topMatch').textContent          = analysisResults[0].finalScore + '%';
    document.getElementById('candidatesScreened').textContent = analysisResults.length;
    const avg = (analysisResults.reduce((s, r) => s + parseFloat(r.skillMatch), 0) / analysisResults.length).toFixed(1);
    document.getElementById('avgSkillMatch').textContent = avg + '%';
}

// ─── Search & filter (extend later) ──────────────────────────
function searchCandidates(query) {}
function filterByScore(filter) {}

// ─── Export CSV ───────────────────────────────────────────────
function exportToCSV() {
    if (!analysisResults) return;
    let csv = 'Rank,Candidate,Final Score,Text Similarity,Skill Match,Experience,Education\n';
    analysisResults.forEach((r, i) => {
        csv += `${i+1},${r.name},${r.finalScore},${r.textSim},${r.skillMatch},${r.experience},${r.education}\n`;
    });
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'candidate_rankings.csv';
    a.click();
}

// ─── Notification ─────────────────────────────────────────────
function showNotification(message) {
    const n = document.getElementById('notification');
    document.getElementById('notificationText').textContent = message;
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 3000);
}