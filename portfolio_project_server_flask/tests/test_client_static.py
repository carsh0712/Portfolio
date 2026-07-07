"""Tests for serving the built Vite client from Flask."""

from flask import g

from models import Portfolio, Project, UploadFile


def _create_dist(tmp_path):
    dist = tmp_path / "dist"
    assets = dist / "assets"
    assets.mkdir(parents=True)
    (dist / "index.html").write_text(
        '<!doctype html><html><head><title>Default</title><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>',
        encoding="utf-8",
    )
    (dist / "red_potion.png").write_bytes(b"png")
    (assets / "app.js").write_text("console.log('client')", encoding="utf-8")
    return dist


def _create_manual(tmp_path):
    manual = tmp_path / "html"
    assets = manual / "assets"
    pages = manual / "pages"
    assets.mkdir(parents=True)
    pages.mkdir(parents=True)
    (manual / "index.html").write_text(
        '<!doctype html><html><head><link rel="stylesheet" href="assets/styles.css"></head><body>Manual</body></html>',
        encoding="utf-8",
    )
    (assets / "styles.css").write_text("body { color: black; }", encoding="utf-8")
    (pages / "note.html").write_text("<!doctype html><html><body>Note</body></html>", encoding="utf-8")
    return manual


def test_root_serves_built_client_when_dist_exists(monkeypatch, tmp_path):
    import app as app_module

    monkeypatch.setattr(app_module, "CLIENT_DIST_DIR", _create_dist(tmp_path))
    flask_app = app_module.create_app()

    with flask_app.test_client() as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert b'<div id="root"></div>' in response.data


def test_client_dist_dir_can_be_overridden_by_env(monkeypatch, tmp_path):
    import app as app_module

    dist = _create_dist(tmp_path)
    monkeypatch.setenv("CLIENT_DIST_DIR", str(dist))

    assert app_module.get_client_dist_dir() == dist


def test_relative_client_dist_dir_is_resolved_from_server_dir(monkeypatch):
    import app as app_module

    monkeypatch.setenv("CLIENT_DIST_DIR", "../portfolio_project_client_vite/dist")

    assert app_module.get_client_dist_dir() == app_module.DEFAULT_CLIENT_DIST_DIR


def test_serves_dist_assets_and_spa_fallback(monkeypatch, tmp_path):
    import app as app_module

    monkeypatch.setattr(app_module, "CLIENT_DIST_DIR", _create_dist(tmp_path))
    flask_app = app_module.create_app()

    with flask_app.test_client() as client:
        root_asset_response = client.get("/red_potion.png")
        js_response = client.get("/assets/app.js")
        spa_response = client.get("/portfolio/demo/project/item")
        public_spa_response = client.get("/public/admin/MYAPPS/ECOMM/")
        api_response = client.get("/api/unknown")

    assert root_asset_response.status_code == 200
    assert root_asset_response.data == b"png"
    assert js_response.status_code == 200
    assert b"console.log" in js_response.data
    assert spa_response.status_code == 200
    assert spa_response.content_type.startswith("text/html")
    assert public_spa_response.status_code == 200
    assert public_spa_response.content_type.startswith("text/html")
    assert api_response.status_code == 404


def test_public_portfolio_route_injects_open_graph_meta(monkeypatch, tmp_path, db_session, test_user):
    import app as app_module

    dist = _create_dist(tmp_path)
    monkeypatch.setattr(app_module, "CLIENT_DIST_DIR", dist)

    image_path = tmp_path / "share.png"
    image_path.write_bytes(b"share image")
    db_file = UploadFile(
        user_id=test_user.id,
        original_filename="share.png",
        stored_filename="share.webp",
        file_size=11,
        content_type="image/png",
        upload_path=str(image_path),
    )
    db_session.add(db_file)
    db_session.flush()

    portfolio = Portfolio(
        user_id=test_user.id,
        code="SHARE",
        name="공유 포트폴리오",
        description="카카오톡 미리보기 설명",
        file_uuid=db_file.uuid,
        is_public=True,
    )
    db_session.add(portfolio)
    db_session.commit()

    flask_app = app_module.create_app()

    @flask_app.before_request
    def override_db():
        g.db = db_session

    flask_app.teardown_appcontext_funcs.clear()

    with flask_app.test_client() as client:
        response = client.get(f"/public/{test_user.username}/SHARE")

    html = response.get_data(as_text=True)
    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert '<script type="module" src="/assets/app.js"></script>' in html
    assert '<div id="root"></div>' in html
    assert '<meta property="og:title" content="공유 포트폴리오" />' in html
    assert '<meta property="og:description" content="카카오톡 미리보기 설명" />' in html
    assert f"/api/v1/public/{test_user.username}/file/{db_file.uuid}" in html


def test_public_project_route_injects_project_open_graph_meta(monkeypatch, tmp_path, db_session, test_user):
    import app as app_module

    monkeypatch.setattr(app_module, "CLIENT_DIST_DIR", _create_dist(tmp_path))

    portfolio = Portfolio(
        user_id=test_user.id,
        code="PROJS",
        name="프로젝트 모음",
        description="포트폴리오 설명",
        is_public=True,
    )
    db_session.add(portfolio)
    db_session.flush()

    project = Project(
        portfolio_id=portfolio.id,
        code="DETAIL",
        title="대표 프로젝트",
        summary="프로젝트 미리보기 설명",
        is_public=True,
    )
    db_session.add(project)
    db_session.commit()

    flask_app = app_module.create_app()

    @flask_app.before_request
    def override_db():
        g.db = db_session

    flask_app.teardown_appcontext_funcs.clear()

    with flask_app.test_client() as client:
        response = client.get(f"/public/{test_user.username}/PROJS/DETAIL")

    html = response.get_data(as_text=True)
    assert response.status_code == 200
    assert '<script type="module" src="/assets/app.js"></script>' in html
    assert '<div id="root"></div>' in html
    assert '<meta property="og:title" content="대표 프로젝트" />' in html
    assert '<meta property="og:description" content="프로젝트 미리보기 설명" />' in html


def test_manual_is_hidden_by_default(monkeypatch, tmp_path):
    import app as app_module

    monkeypatch.delenv("MANUAL_PUBLIC", raising=False)
    monkeypatch.setattr(app_module, "MANUAL_DIR", _create_manual(tmp_path))
    flask_app = app_module.create_app()

    with flask_app.test_client() as client:
        response = client.get("/manual")
        asset_response = client.get("/manual/assets/styles.css")

    assert response.status_code == 404
    assert asset_response.status_code == 404


def test_manual_serves_html_when_enabled(monkeypatch, tmp_path):
    import app as app_module

    monkeypatch.setenv("MANUAL_PUBLIC", "true")
    monkeypatch.setattr(app_module, "MANUAL_DIR", _create_manual(tmp_path))
    flask_app = app_module.create_app()

    with flask_app.test_client() as client:
        redirect_response = client.get("/manual")
        trailing_response = client.get("/manual/")
        css_response = client.get("/manual/assets/styles.css")
        note_response = client.get("/manual/pages/note.html")

    assert redirect_response.status_code == 308
    assert redirect_response.headers["Location"] == "/manual/"
    assert trailing_response.status_code == 200
    assert trailing_response.content_type.startswith("text/html")
    assert b"Manual" in trailing_response.data
    assert css_response.status_code == 200
    assert b"color: black" in css_response.data
    assert note_response.status_code == 200
    assert b"Note" in note_response.data
