"""/api/v1/projects/* 엔드포인트 통합 테스트."""
import pytest
from models import Portfolio, Project


# === Create ===


class TestCreateProject:
    def test_success(self, client, sample_portfolio):
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": sample_portfolio.code,
            "code": "NEWIT",
            "title": "New Project Item",
            "summary": "Description of the item",
            "tags": ["python", "web"],
            "order": 0,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["title"] == "New Project Item"
        assert data["tags"] == ["python", "web"]
        assert data["portfolio_id"] == sample_portfolio.id
        assert data["is_public"] is True

    def test_with_defaults(self, client, sample_portfolio):
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": sample_portfolio.code,
            "code": "MINIM",
            "title": "Minimal Item",
            "summary": "Minimal",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["tags"] == []
        assert data["order"] == 0
        assert data["thumbnail"] is None
        assert data["is_public"] is True

    def test_with_is_public_false(self, client, sample_portfolio):
        """is_public을 false로 설정하여 생성"""
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": sample_portfolio.code,
            "code": "PRIV1",
            "title": "Private Item",
            "summary": "This is private",
            "is_public": False,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["title"] == "Private Item"
        assert data["is_public"] is False

    def test_other_users_portfolio(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="OTHERC", name="OtherCat", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()

        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": cat.code,
            "code": "SNEAK",
            "title": "Sneaky Item",
            "summary": "Should fail",
        })
        assert resp.status_code == 404

    def test_nonexistent_portfolio(self, client):
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": "NONEXISTENT",
            "code": "ORPH1",
            "title": "Orphan",
            "summary": "No portfolio",
        })
        assert resp.status_code == 404


# === Read List ===


class TestReadProjects:
    def test_list_by_portfolio(self, client, sample_portfolio, sample_item):
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data
        assert "meta" in data
        assert len(data["items"]) >= 1
        assert data["items"][0]["title"] == "Test Item"

    def test_empty_portfolio(self, client, db_session, test_user):
        cat = Portfolio(
            user_id=test_user.id, code="EMPTY", name="Empty", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={cat.code}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["items"] == []
        assert data["meta"]["total"] == 0

    def test_other_users_portfolio(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="OTHER", name="Other", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={cat.code}")
        assert resp.status_code == 404

    def test_ordered_by_order(self, client, sample_portfolio, db_session):
        i1 = Project(
            portfolio_id=sample_portfolio.id, code="ITEMB", title="B", summary="S", order=2
        )
        i2 = Project(
            portfolio_id=sample_portfolio.id, code="ITEMA", title="A", summary="S", order=1
        )
        db_session.add_all([i1, i2])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}")
        data = resp.get_json()
        orders = [item["order"] for item in data["items"]]
        assert orders == sorted(orders)

    def test_pagination_first_page(self, client, sample_portfolio, db_session):
        """First page should return correct items and meta"""
        for i in range(15):
            item = Project(
                portfolio_id=sample_portfolio.id,
                code=f"ITEM{i}",
                title=f"Item{i}",
                summary="S",
                order=i
            )
            db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=1&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 10
        assert data["meta"]["total"] == 15
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 10
        assert data["meta"]["total_pages"] == 2

    def test_pagination_second_page(self, client, sample_portfolio, db_session):
        """Second page should return remaining items"""
        for i in range(15):
            item = Project(
                portfolio_id=sample_portfolio.id,
                code=f"ITEM{i}",
                title=f"Item{i}",
                summary="S",
                order=i
            )
            db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=2&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 5
        assert data["meta"]["page"] == 2
        assert data["meta"]["total"] == 15

    def test_pagination_page_beyond_total(self, client, sample_portfolio, sample_item):
        """Requesting page beyond total should return empty items"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=999&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["items"] == []
        assert data["meta"]["total"] >= 1
        assert data["meta"]["page"] == 999

    def test_pagination_custom_page_size(self, client, sample_portfolio, db_session):
        """Custom page_size should be respected"""
        for i in range(25):
            item = Project(
                portfolio_id=sample_portfolio.id,
                code=f"ITEM{i}",
                title=f"Item{i}",
                summary="S",
                order=i
            )
            db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=1&page_size=20")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 20
        assert data["meta"]["page_size"] == 20
        assert data["meta"]["total_pages"] == 2

    def test_pagination_invalid_page_zero(self, client, sample_portfolio):
        """Page 0 should return validation error"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=0")
        assert resp.status_code == 422

    def test_pagination_invalid_page_negative(self, client, sample_portfolio):
        """Negative page should return validation error"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page=-1")
        assert resp.status_code == 422

    def test_pagination_invalid_page_size_zero(self, client, sample_portfolio):
        """page_size 0 should return validation error"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page_size=0")
        assert resp.status_code == 422

    def test_pagination_invalid_page_size_exceeds_max(self, client, sample_portfolio):
        """page_size > 100 should return validation error"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&page_size=101")
        assert resp.status_code == 422

    def test_pagination_default_values(self, client, sample_portfolio, db_session):
        """Without params, should use page=1, page_size=10"""
        for i in range(15):
            item = Project(
                portfolio_id=sample_portfolio.id,
                code=f"ITEM{i}",
                title=f"Item{i}",
                summary="S",
                order=i
            )
            db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 10
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 10


# === Search / Filter ===


class TestSearchProjects:
    def test_search_matches_tag(self, client, sample_portfolio, db_session):
        """search로 tags에서 매칭"""
        p1 = Project(portfolio_id=sample_portfolio.id, code="PYTAG", title="P1", summary="S", order=0, tags=["python", "web"])
        p2 = Project(portfolio_id=sample_portfolio.id, code="JSTAG", title="P2", summary="S", order=1, tags=["javascript", "web"])
        db_session.add_all([p1, p2])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=python")
        assert resp.status_code == 200
        data = resp.get_json()
        codes = [item["code"] for item in data["items"]]
        assert "PYTAG" in codes
        assert "JSTAG" not in codes

    def test_search_matches_tech_stack(self, client, sample_portfolio, db_session):
        """search로 tech_stack에서 매칭"""
        p1 = Project(portfolio_id=sample_portfolio.id, code="REACT", title="P1", summary="S", order=0, tech_stack=["React", "Node.js"])
        p2 = Project(portfolio_id=sample_portfolio.id, code="FLASK", title="P2", summary="S", order=1, tech_stack=["Python", "Flask"])
        db_session.add_all([p1, p2])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=React")
        assert resp.status_code == 200
        data = resp.get_json()
        codes = [item["code"] for item in data["items"]]
        assert "REACT" in codes
        assert "FLASK" not in codes

    def test_search_matches_either_tag_or_tech_stack(self, client, sample_portfolio, db_session):
        """search가 tags 또는 tech_stack 중 하나라도 매칭되면 반환 (OR)"""
        p1 = Project(portfolio_id=sample_portfolio.id, code="INTAG", title="P1", summary="S", order=0, tags=["python"], tech_stack=["Flask"])
        p2 = Project(portfolio_id=sample_portfolio.id, code="INTEC", title="P2", summary="S", order=1, tags=["java"], tech_stack=["python"])
        p3 = Project(portfolio_id=sample_portfolio.id, code="NOMAN", title="P3", summary="S", order=2, tags=["java"], tech_stack=["Flask"])
        db_session.add_all([p1, p2, p3])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=python")
        assert resp.status_code == 200
        data = resp.get_json()
        codes = [item["code"] for item in data["items"]]
        assert "INTAG" in codes
        assert "INTEC" in codes
        assert "NOMAN" not in codes

    def test_search_partial_match_tag(self, client, sample_portfolio, db_session):
        """LIKE 검색으로 tags 부분 일치 확인"""
        p1 = Project(portfolio_id=sample_portfolio.id, code="REACT", title="P1", summary="S", order=0, tags=["React Native", "mobile"])
        p2 = Project(portfolio_id=sample_portfolio.id, code="FLASK", title="P2", summary="S", order=1, tags=["Python", "Flask"])
        db_session.add_all([p1, p2])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=React")
        assert resp.status_code == 200
        data = resp.get_json()
        codes = [item["code"] for item in data["items"]]
        assert "REACT" in codes
        assert "FLASK" not in codes

    def test_search_partial_match_tech_stack(self, client, sample_portfolio, db_session):
        """LIKE 검색으로 tech_stack 부분 일치 확인"""
        p1 = Project(portfolio_id=sample_portfolio.id, code="NODEP", title="P1", summary="S", order=0, tech_stack=["Node.js", "Express"])
        p2 = Project(portfolio_id=sample_portfolio.id, code="DJANG", title="P2", summary="S", order=1, tech_stack=["Django", "Python"])
        db_session.add_all([p1, p2])
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=Node")
        assert resp.status_code == 200
        data = resp.get_json()
        codes = [item["code"] for item in data["items"]]
        assert "NODEP" in codes
        assert "DJANG" not in codes

    def test_search_no_match(self, client, sample_portfolio, sample_item):
        """매칭 결과 없을 때 빈 리스트"""
        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=nonexistent")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["items"] == []
        assert data["meta"]["total"] == 0

    def test_search_with_pagination(self, client, sample_portfolio, db_session):
        """search + 페이지네이션 동시 동작"""
        for i in range(15):
            db_session.add(Project(
                portfolio_id=sample_portfolio.id, code=f"WEB{i:02d}", title=f"Web{i}", summary="S", order=i, tags=["web"],
            ))
        db_session.add(Project(
            portfolio_id=sample_portfolio.id, code="OTHER", title="Other", summary="S", order=99, tags=["mobile"],
        ))
        db_session.commit()

        resp = client.get(f"/api/v1/projects/?portfolio_code={sample_portfolio.code}&search=web&page=1&page_size=10")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["items"]) == 10
        assert data["meta"]["total"] == 15
        assert data["meta"]["total_pages"] == 2


# === Read Single ===


class TestReadSingleProject:
    def test_existing(self, client, sample_portfolio, sample_item):
        resp = client.get(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}")
        assert resp.status_code == 200
        assert resp.get_json()["code"] == sample_item.code

    def test_nonexistent(self, client, sample_portfolio):
        resp = client.get(f"/api/v1/projects/{sample_portfolio.code}/NONEXIST")
        assert resp.status_code == 404

    def test_other_users_item(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="OCCAT", name="OC", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        item = Project(
            portfolio_id=cat.id, code="OITEM", title="OI", summary="S", order=0
        )
        db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/{cat.code}/{item.code}")
        assert resp.status_code == 404


# === Update ===


class TestUpdateProject:
    def test_success(self, client, sample_portfolio, sample_item):
        resp = client.put(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}", json={
            "title": "Updated Title",
        })
        assert resp.status_code == 200
        assert resp.get_json()["title"] == "Updated Title"
        assert resp.get_json()["summary"] == "A test project item"  # unchanged

    def test_update_is_public(self, client, sample_portfolio, sample_item):
        """is_public 필드 업데이트 테스트"""
        resp = client.put(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}", json={
            "is_public": False,
        })
        assert resp.status_code == 200
        assert resp.get_json()["is_public"] is False
        assert resp.get_json()["title"] == "Test Item"  # unchanged

    def test_move_to_owned_portfolio(self, client, db_session, test_user, sample_portfolio, sample_item):
        new_cat = Portfolio(
            user_id=test_user.id, code="NEWCT", name="NewCat", description="D", order=1
        )
        db_session.add(new_cat)
        db_session.commit()

        resp = client.put(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}", json={
            "portfolio_id": new_cat.id,
        })
        assert resp.status_code == 200
        assert resp.get_json()["portfolio_id"] == new_cat.id

    def test_move_to_others_portfolio(self, client, db_session, other_user, sample_portfolio, sample_item):
        foreign_cat = Portfolio(
            user_id=other_user.id, code="FREIG", name="Foreign", description="D", order=0
        )
        db_session.add(foreign_cat)
        db_session.commit()

        resp = client.put(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}", json={
            "portfolio_id": foreign_cat.id,
        })
        assert resp.status_code == 404

    def test_update_link_background_color(self, client, sample_portfolio, sample_item):
        """link의 background_color 변경이 DB에 정상 반영되는지 확인"""
        url = f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}"
        # 초기 links 설정
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#000000", "text_color": "#ffffff", "icon": "github"},
                {"name": "demo", "url": "https://demo.com", "background_color": "#007bff", "text_color": "#ffffff", "icon": "globe"},
            ],
        })
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["background_color"] == "#000000"
        assert resp.get_json()["links"][1]["background_color"] == "#007bff"

        # background_color만 변경
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#ff0000", "text_color": "#ffffff", "icon": "github"},
                {"name": "demo", "url": "https://demo.com", "background_color": "#28a745", "text_color": "#ffffff", "icon": "globe"},
            ],
        })
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["background_color"] == "#ff0000"
        assert resp.get_json()["links"][1]["background_color"] == "#28a745"

        # GET으로 DB 반영 확인
        resp = client.get(url)
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["background_color"] == "#ff0000"
        assert resp.get_json()["links"][1]["background_color"] == "#28a745"

    def test_update_link_text_color(self, client, sample_portfolio, sample_item):
        """link의 text_color 변경이 DB에 정상 반영되는지 확인"""
        url = f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}"
        # 초기 links 설정
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#000000", "text_color": "#ffffff", "icon": "github"},
            ],
        })
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["text_color"] == "#ffffff"

        # text_color만 변경
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#000000", "text_color": "#333333", "icon": "github"},
            ],
        })
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["text_color"] == "#333333"

        # GET으로 DB 반영 확인
        resp = client.get(url)
        assert resp.status_code == 200
        assert resp.get_json()["links"][0]["text_color"] == "#333333"

    def test_update_link_both_colors(self, client, sample_portfolio, sample_item):
        """link의 background_color와 text_color를 동시에 변경"""
        url = f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}"
        # 초기 설정
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#000000", "text_color": "#ffffff", "icon": "github"},
            ],
        })
        assert resp.status_code == 200

        # 두 색상 모두 변경
        resp = client.put(url, json={
            "links": [
                {"name": "github", "url": "https://github.com/test", "background_color": "#e74c3c", "text_color": "#2c3e50", "icon": "github"},
            ],
        })
        assert resp.status_code == 200
        link = resp.get_json()["links"][0]
        assert link["background_color"] == "#e74c3c"
        assert link["text_color"] == "#2c3e50"

        # GET으로 DB 반영 확인
        resp = client.get(url)
        assert resp.status_code == 200
        link = resp.get_json()["links"][0]
        assert link["background_color"] == "#e74c3c"
        assert link["text_color"] == "#2c3e50"

    def test_nonexistent(self, client, sample_portfolio):
        resp = client.put(f"/api/v1/projects/{sample_portfolio.code}/NONEXIST", json={"title": "X"})
        assert resp.status_code == 404


# === Delete ===


class TestDeleteProject:
    def test_success(self, client, sample_portfolio, sample_item):
        resp = client.delete(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}")
        assert resp.status_code == 200
        assert "deleted" in resp.get_json()["message"].lower()

    def test_nonexistent(self, client, sample_portfolio):
        resp = client.delete(f"/api/v1/projects/{sample_portfolio.code}/NONEXIST")
        assert resp.status_code == 404

    def test_other_users_item(self, client, db_session, other_user):
        cat = Portfolio(
            user_id=other_user.id, code="OCCAT", name="OC", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        item = Project(
            portfolio_id=cat.id, code="OITEM", title="OI", summary="S", order=0
        )
        db_session.add(item)
        db_session.commit()

        resp = client.delete(f"/api/v1/projects/{cat.code}/{item.code}")
        assert resp.status_code == 404
