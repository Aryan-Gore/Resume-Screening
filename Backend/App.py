from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from resume_screening_ai import ResumeScreeningAI   

app = Flask(__name__, static_folder='.')   
CORS(app)


# Serves frontend_app.html when user opens http://localhost:5000
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')  # points to frontend folder

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    try:                                          
        data = request.json

        job_description = data.get('job_description')
        resumes         = data.get('resumes')

        if not job_description or not resumes:
            return jsonify({'error': 'Missing job_description or resumes'}), 400

        ai = ResumeScreeningAI()
        ai.load_job_description(job_description)
        ai.load_resumes(resumes)
        results = ai.calculate_final_scores()

        output = results.to_dict(orient='records')
        return jsonify(output)

    except Exception as e:
        return jsonify({'error': str(e)}), 500   # returns error instead of crashing


if __name__ == '__main__':
    app.run(debug=True)