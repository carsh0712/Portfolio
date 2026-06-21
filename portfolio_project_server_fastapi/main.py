"""Flask 앱 실행 엔트리포인트 (하위 호환용)."""
from app import app

if __name__ == "__main__":
    app.run(debug=True, port=8000)
