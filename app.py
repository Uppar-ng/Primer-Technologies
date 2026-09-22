from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os

# static_folder='.' → serve files from the current directory (where app.py lives)
# static_url_path='' → don't prefix with /static
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# In-memory storage (swap for Vercel KV / Postgres in production)
data_storage = []


# ---------- Serve app.html at root ----------
@app.route('/')
def index():
    # app.html is in the SAME folder as app.py
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'app.html')


# ---------- API endpoints ----------
@app.route('/api/submit', methods=['POST'])
def submit_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        data['timestamp'] = datetime.now().isoformat()
        data_storage.append(data)

        return jsonify({
            'success': True,
            'message': 'Data stored successfully',
            'data': data
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({
        'success': True,
        'count': len(data_storage),
        'data': data_storage
    }), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
