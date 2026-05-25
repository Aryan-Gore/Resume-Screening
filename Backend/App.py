from flask import Flask, request, jsonify
from flask_cors import CORS
from resume_screening_ai import ResumeScreeningAI

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze_resume():

    data = request.json

    job_description = data.get("job_description")
    resumes = data.get("resumes")

    ai = ResumeScreeningAI()

    # Load job description
    ai.load_job_description(job_description)

    # Load resumes
    ai.load_resumes(resumes)

    # Calculate scores
    results = ai.calculate_final_scores()

    # Convert dataframe to JSON
    output = results.to_dict(orient="records")
    
    return jsonify(output)

if __name__ == "__main__":
    app.run(debug=True)