"""/api/v1/portfolios/* 엔드포인트 통합 테스트."""
import pytest
from models import Portfolio


# === Create ===


class TestCreatePortfolio:
    def test_success(self, client):
        resp = client.post("/api/v1/portfolios/", json={
            "code": "WEBAP",
            "name": "Web Apps",
            "description": "My web applications",
            "screenshot": None,
            "order": 1,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["code"] == "WEBAP"
        assert data["name"] == "Web Apps"
        assert data["order"] == 1
        assert data["is_public"] is True

    def test_with_defaults(self, client):
        resp = client.post("/api/v1/portfolios/", json={
            "code": "MINIM",
            "name": "Minimal",
            "description": "Minimal portfolio",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["code"] == "MINIM"
        assert data["order"] == 0
        assert data["screenshot"] is None
        assert data["is_public"] is True

    def test_with_is_public_false(self, client):
        """is_public을 false로 설정하여 생성"""
        resp = client.post("/api/v1/portfolios/", json={
            "code": "PRIV1",
            "name": "Private Portfolio",
            "description": "This is private",
            "is_public": False,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["code"] == "PRIV1"
        assert data["name"] == "Private Portfolio"
        assert data["is_public"] is False

    def test_code_min_length(self, client):
        """code는 최소 5글자여야 함"""
        resp = client.post("/api/v1/portfolios/", json={
            "code": "ABC",
            "name": "Short Code",
            "description": "Portfolio with short code",
        })
        assert resp.status_code == 422

    def test_code_duplicate_same_user(self, client):
        """같은 유저의 중복 code는 불가"""
        client.post("/api/v1/portfolios/", json={
            "code": "DUPLI",
            "name": "First",
            "description": "First portfolio",
        })
        resp = client.post("/api/v1/portfolios/", json={
            "code": "DUPLI",
            "name": "Second",
            "description": "Second portfolio",
        })
        assert resp.status_code == 400
        assert "already exists" in resp.get_json()["detail"].lower()

    def test_missing_required_field(self, client):
        resp = client.post("/api/v1/portfolios/", json={"name": "No Desc"})
        assert resp.status_code == 422


# === Read List ===


class TestReadCategories:
    def test_list_empty(self, client):
        resp = client.get("/api/v1/portfolios/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data
        assert "meta" in data
        assert data["items"] == []
        assert data["meta"]["total"] == 0
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 10
        assert data["meta"]["total_pages"] == 0

    def test_list_returns_own(self, client, sample_portfolio):
        resp = client.get("/api/v1/portfolios/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) >= 1
        assert data["items"][0]["name"] == "Test Portfolio"
        assert data["meta"]["total"] >= 1

    def test_list_ordered(self, client, db_session, test_user):
        c1 = Portfolio(
            user_id=test_user.id, code="SECON", name="Second", description="D", order=2
        )
        c2 = Portfolio(
            user_id=test_user.id, code="FIRST", name="First", description="D", order=1
        )
        db_session.add_all([c1, c2])
        db_session.commit()

        resp = client.get("/api/v1/portfolios/")
        data = resp.get_json()
        orders = [c["order"] for c in data["items"]]
        assert orders == sorted(orders)

    def test_pagination_first_page(self, client, db_session, test_user):
        """First page should return correct items and meta"""
        for i in range(15):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        resp = client.get("/api/v1/portfolios/?page=1&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 10
        assert data["meta"]["total"] == 15
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 10
        assert data["meta"]["total_pages"] == 2

    def test_pagination_second_page(self, client, db_session, test_user):
        """Second page should return remaining items"""
        for i in range(15):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        resp = client.get("/api/v1/portfolios/?page=2&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 5
        assert data["meta"]["page"] == 2
        assert data["meta"]["total"] == 15

    def test_pagination_page_beyond_total(self, client, sample_portfolio):
        """Requesting page beyond total should return empty items"""
        resp = client.get("/api/v1/portfolios/?page=999&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["items"] == []
        assert data["meta"]["total"] >= 1
        assert data["meta"]["page"] == 999

    def test_pagination_custom_page_size(self, client, db_session, test_user):
        """Custom page_size should be respected"""
        for i in range(25):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        resp = client.get("/api/v1/portfolios/?page=1&page_size=20")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 20
        assert data["meta"]["page_size"] == 20
        assert data["meta"]["total_pages"] == 2

    def test_pagination_invalid_page_zero(self, client):
        """Page 0 should return validation error"""
        resp = client.get("/api/v1/portfolios/?page=0")
        assert resp.status_code == 422

    def test_pagination_invalid_page_negative(self, client):
        """Negative page should return validation error"""
        resp = client.get("/api/v1/portfolios/?page=-1")
        assert resp.status_code == 422

    def test_pagination_invalid_page_size_zero(self, client):
        """page_size 0 should return validation error"""
        resp = client.get("/api/v1/portfolios/?page_size=0")
        assert resp.status_code == 422

    def test_pagination_invalid_page_size_exceeds_max(self, client):
        """page_size > 100 should return validation error"""
        resp = client.get("/api/v1/portfolios/?page_size=101")
        assert resp.status_code == 422

    def test_pagination_default_values(self, client, db_session, test_user):
        """Without params, should use page=1, page_size=10"""
        for i in range(15):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        resp = client.get("/api/v1/portfolios/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 10
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 10


# === Read Single ===


class TestReadSinglePortfolio:
    def test_existing(self, client, sample_portfolio):
        resp = client.get(f"/api/v1/portfolios/{sample_portfolio.code}")
        assert resp.status_code == 200
        assert resp.get_json()["code"] == sample_portfolio.code

    def test_nonexistent(self, client):
        resp = client.get("/api/v1/portfolios/NOEXT")
        assert resp.status_code == 404

    def test_other_users_portfolio(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="OTHER", name="Other's Cat", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        resp = client.get(f"/api/v1/portfolios/{cat.code}")
        assert resp.status_code == 404


# === Update ===


class TestUpdatePortfolio:
    def test_success(self, client, sample_portfolio):
        resp = client.put(f"/api/v1/portfolios/{sample_portfolio.code}", json={
            "name": "Updated Name",
        })
        assert resp.status_code == 200
        assert resp.get_json()["name"] == "Updated Name"
        assert resp.get_json()["description"] == "A test portfolio"  # unchanged
        assert resp.get_json()["code"] == "TESTC"  # unchanged

    def test_update_code(self, client, sample_portfolio):
        """code 필드 업데이트 테스트"""
        resp = client.put(f"/api/v1/portfolios/{sample_portfolio.code}", json={
            "code": "NEWCD",
        })
        assert resp.status_code == 200
        assert resp.get_json()["code"] == "NEWCD"
        assert resp.get_json()["name"] == "Test Portfolio"  # unchanged

    def test_update_code_duplicate(self, client, db_session, test_user, sample_portfolio):
        """중복 code로 업데이트 시도"""
        # 다른 카테고리 생성
        other_cat = Portfolio(
            user_id=test_user.id, code="OTHER", name="Other", description="D", order=1
        )
        db_session.add(other_cat)
        db_session.commit()

        # sample_portfolio의 code를 OTHER로 변경 시도
        resp = client.put(f"/api/v1/portfolios/{sample_portfolio.code}", json={
            "code": "OTHER",
        })
        assert resp.status_code == 400
        assert "already exists" in resp.get_json()["detail"].lower()

    def test_update_code_min_length(self, client, sample_portfolio):
        """code 최소 길이 검증"""
        resp = client.put(f"/api/v1/portfolios/{sample_portfolio.code}", json={
            "code": "ABC",
        })
        assert resp.status_code == 422

    def test_update_is_public(self, client, sample_portfolio):
        """is_public 필드 업데이트 테스트"""
        resp = client.put(f"/api/v1/portfolios/{sample_portfolio.code}", json={
            "is_public": False,
        })
        assert resp.status_code == 200
        assert resp.get_json()["is_public"] is False
        assert resp.get_json()["name"] == "Test Portfolio"  # unchanged

    def test_nonexistent(self, client):
        resp = client.put("/api/v1/portfolios/NOEXT", json={"name": "X"})
        assert resp.status_code == 404

    def test_other_users_portfolio(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="THEIR", name="Theirs", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        resp = client.put(f"/api/v1/portfolios/{cat.code}", json={"name": "Stolen"})
        assert resp.status_code == 404


# === Delete ===


class TestDeletePortfolio:
    def test_success(self, client, sample_portfolio):
        resp = client.delete(f"/api/v1/portfolios/{sample_portfolio.code}")
        assert resp.status_code == 200
        assert "deleted" in resp.get_json()["message"].lower()

        resp2 = client.get(f"/api/v1/portfolios/{sample_portfolio.code}")
        assert resp2.status_code == 404

    def test_nonexistent(self, client):
        resp = client.delete("/api/v1/portfolios/NOEXT")
        assert resp.status_code == 404

    def test_other_users_portfolio(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="THEIR", name="Theirs", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        resp = client.delete(f"/api/v1/portfolios/{cat.code}")
        assert resp.status_code == 404
