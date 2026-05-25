
        async function analyzeResume() {

    const jobDescription = document.getElementById("jobDesc").value;

    const data = {
        job_description: jobDescription,

        resumes: [
            {
                name: "Aryan Gore",
                text: "Python Java Machine Learning 2 years experience"
            },
            {
                name: "Rahul",
                text: "JavaScript React Node.js 1 year experience"
            }
        ]
    };

    try {

        const response = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        console.log(result);

        displayResults(result);

    } catch (error) {
        console.error(error);
    }
}

function displayResults(results) {

    const container = document.getElementById("results");

    container.innerHTML = "";

    results.forEach(candidate => {

        container.innerHTML += `
            <div class="card">
                <h3>${candidate.Candidate}</h3>
                <p>Rank: ${candidate.Rank}</p>
                <p>Final Score: ${candidate.Final_Score}%</p>
            </div>
        `;
    });
}

        // Global variables
        let uploadedFiles = [];
        let analysisResults = null;
        let currentCandidate = null;

        // Show page function
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            if (pageId === 'dashboard') document.querySelectorAll('.nav-link')[0].classList.add('active');
            if (pageId === 'job-description' || pageId === 'resume-upload') {
                document.querySelectorAll('.nav-link')[1].classList.add('active');
            }
            if (pageId === 'analytics') document.querySelectorAll('.nav-link')[2].classList.add('active');
        }

        // Dark mode toggle
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.querySelector('.dark-toggle').textContent = isDark ? '☀️' : '🌙';
        }

        // Update weights
        function updateWeights() {
            const textSim = parseInt(document.getElementById('textSim').value);
            const skillMatch = parseInt(document.getElementById('skillMatch').value);
            const experience = parseInt(document.getElementById('experience').value);
            const education = parseInt(document.getElementById('education').value);
            
            document.getElementById('textSimValue').textContent = textSim + '%';
            document.getElementById('skillMatchValue').textContent = skillMatch + '%';
            document.getElementById('experienceValue').textContent = experience + '%';
            document.getElementById('educationValue').textContent = education + '%';
            
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

        // File upload handling
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
                        <div style="font-weight: 600;">${file.name}</div>
                        <div style="font-size: 0.85rem; color: var(--gray);">${(file.size / 1024).toFixed(1)} KB</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 100%"></div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline" onclick="removeFile('${file.name}')" style="padding: 0.5rem 1rem;">✕</button>
            `;
            fileList.appendChild(card);
        }

        function removeFile(fileName) {
            uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
            fileList.innerHTML = '';
            uploadedFiles.forEach(f => addFileCard(f));
            document.getElementById('analyzeBtn').disabled = uploadedFiles.length < 2;
        }

        // Analyze resumes
        function analyzeResumes() {
            if (uploadedFiles.length < 2) {
                showNotification('Please upload at least 2 resumes');
                return;
            }

            const total = parseInt(document.getElementById('totalWeight').textContent);
            if (total !== 100) {
                showNotification('Weights must total 100%');
                return;
            }

            // Show loading
            showNotification('Analyzing candidates... Please wait');
            
            // Simulate analysis
            setTimeout(() => {
                generateMockResults();
                updateDashboardStats();
                showPage('results');
                showNotification('Analysis complete! ✓');
            }, 2000);
        }

        function generateMockResults() {
            analysisResults = uploadedFiles.map((file, index) => {
                const finalScore = 60 + Math.random() * 40;
                return {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    finalScore: finalScore.toFixed(2),
                    textSim: (finalScore + (Math.random() - 0.5) * 10).toFixed(2),
                    skillMatch: (finalScore + (Math.random() - 0.5) * 10).toFixed(2),
                    experience: (finalScore + (Math.random() - 0.5) * 10).toFixed(2),
                    education: (finalScore + (Math.random() - 0.5) * 10).toFixed(2),
                    techSkills: Math.floor(5 + Math.random() * 10),
                    softSkills: Math.floor(3 + Math.random() * 5)
                };
            }).sort((a, b) => b.finalScore - a.finalScore);

            displayResults(analysisResults);
        }

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
                            <div class="score-fill" style="width: ${result.finalScore}%">${result.finalScore}%</div>
                        </div>
                    </td>
                    <td>${result.textSim}%</td>
                    <td>${result.skillMatch}%</td>
                    <td>${result.experience}%</td>
                    <td>${result.education}%</td>
                    <td><button class="btn btn-primary" onclick="viewCandidate(${index})" style="padding: 0.5rem 1rem;">View</button></td>
                `;
                tbody.appendChild(row);
            });
        }

        function viewCandidate(index) {
            const candidate = analysisResults[index];
            currentCandidate = candidate;

            document.getElementById('candidateName').textContent = candidate.name;
            document.getElementById('candidateAvatar').textContent = candidate.name.substring(0, 2).toUpperCase();
            document.getElementById('candidateScore').textContent = candidate.finalScore + '%';
            document.getElementById('candidateExp').textContent = Math.floor(Math.random() * 8 + 2);
            document.getElementById('candidateEdu').textContent = ['PhD', 'Masters', 'Bachelors'][Math.floor(Math.random() * 3)];

            // Set badge
            const badge = document.getElementById('candidateBadge');
            if (candidate.finalScore >= 80) {
                badge.className = 'recommendation-badge badge-excellent';
                badge.textContent = '⭐ Highly Recommended';
            } else if (candidate.finalScore >= 60) {
                badge.className = 'recommendation-badge badge-good';
                badge.textContent = '✓ Recommended';
            } else {
                badge.className = 'recommendation-badge badge-review';
                badge.textContent = '⚠ Needs Review';
            }

            // Update scores
            document.getElementById('detailTextSim').textContent = candidate.textSim + '%';
            document.getElementById('detailTextSimBar').style.width = candidate.textSim + '%';
            document.getElementById('detailTextSimBar').textContent = candidate.textSim + '%';
            
            document.getElementById('detailSkillMatch').textContent = candidate.skillMatch + '%';
            document.getElementById('detailSkillMatchBar').style.width = candidate.skillMatch + '%';
            document.getElementById('detailSkillMatchBar').textContent = candidate.skillMatch + '%';
            
            document.getElementById('detailExperience').textContent = candidate.experience + '%';
            document.getElementById('detailExperienceBar').style.width = candidate.experience + '%';
            document.getElementById('detailExperienceBar').textContent = candidate.experience + '%';
            
            document.getElementById('detailEducation').textContent = candidate.education + '%';
            document.getElementById('detailEducationBar').style.width = candidate.education + '%';
            document.getElementById('detailEducationBar').textContent = candidate.education + '%';

            // Mock skills
            const techSkills = ['Python', 'Machine Learning', 'TensorFlow', 'NLP', 'Docker', 'AWS'];
            const softSkills = ['Leadership', 'Communication', 'Problem Solving', 'Teamwork'];
            
            document.getElementById('technicalSkills').innerHTML = techSkills.map(s => 
                `<span class="skill-tag">${s}</span>`
            ).join('');
            
            document.getElementById('softSkills').innerHTML = softSkills.map(s => 
                `<span class="skill-tag">${s}</span>`
            ).join('');

            showPage('candidate-detail');
        }

        function updateDashboardStats() {
            if (!analysisResults) return;
            
            document.getElementById('totalResumes').textContent = analysisResults.length;
            document.getElementById('topMatch').textContent = analysisResults[0].finalScore + '%';
            document.getElementById('candidatesScreened').textContent = analysisResults.length;
            const avgSkill = (analysisResults.reduce((sum, r) => sum + parseFloat(r.skillMatch), 0) / analysisResults.length).toFixed(1);
            document.getElementById('avgSkillMatch').textContent = avgSkill + '%';
        }

        function searchCandidates(query) {
            // Implement search functionality
        }

        function filterByScore(filter) {
            // Implement filter functionality
        }

        function exportToCSV() {
            if (!analysisResults) return;
            
            let csv = 'Rank,Candidate,Final Score,Text Similarity,Skill Match,Experience,Education\n';
            analysisResults.forEach((r, i) => {
                csv += `${i + 1},${r.name},${r.finalScore},${r.textSim},${r.skillMatch},${r.experience},${r.education}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'candidate_rankings.csv';
            a.click();
        }

        function showNotification(message) {
            const notification = document.getElementById('notification');
            document.getElementById('notificationText').textContent = message;
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 3000);
        }
   