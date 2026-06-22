"""Tests for serving the built Vite client from Flask."""


def _create_dist(tmp_path):
    dist = tmp_path / "dist"
    assets = dist / "assets"
    assets.mkdir(parents=True)
    (dist / "index.html").write_text(
        '<!doctype html><html><head><script src="/assets/app.js"></script></head><body>Client</body></html>',
        encoding="utf-8",
    )
    (dist / "red_potion.png").write_bytes(b"png")
    (assets / "app.js").write_text("console.log('client')", encoding="utf-8")
    return dist


def test_root_serves_built_client_when_dist_exists(monkeypatch, tmp_path):
    import app as app_module

    monkeypatch.setattr(app_module, "CLIENT_DIST_DIR", _create_dist(tmp_path))
    flask_app = app_module.create_app()

    with flask_app.test_client() as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.content_type.startswith("text/html")
    assert b"Client" in response.data


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
