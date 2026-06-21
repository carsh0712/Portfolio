"""프로젝트 아이템 상세 필드 테스트."""
import pytest
from models import Portfolio, Project


class TestReadProjectWithDetail:
    """GET /api/v1/projects/{portfolio_code}/{project_code} 상세 필드 포함 테스트"""

    def test_success(self, client, sample_portfolio, sample_item_with_detail):
        """detail 필드가 있는 아이템 조회 성공"""
        resp = client.get(f"/api/v1/projects/{sample_portfolio.code}/{sample_item_with_detail.code}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["code"] == sample_item_with_detail.code
        assert data["portfolio_id"] == sample_item_with_detail.portfolio_id
        assert data["title"] == sample_item_with_detail.title
        assert data["summary"] == sample_item_with_detail.summary
        assert data["description"] == "Detailed description"
        assert data["tech_stack"] == ["Python", "FastAPI", "PostgreSQL"]
        assert len(data["links"]) == 3
        assert data["features"] == ["Feature 1", "Feature 2"]

    def test_item_without_detail(self, client, sample_portfolio, sample_item):
        """detail 필드가 없는 아이템도 조회 가능 (description=None)"""
        resp = client.get(f"/api/v1/projects/{sample_portfolio.code}/{sample_item.code}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["description"] is None
        assert data["tech_stack"] == []
        assert data["features"] == []

    def test_nonexistent_item(self, client, sample_portfolio):
        """존재하지 않는 아이템"""
        resp = client.get(f"/api/v1/projects/{sample_portfolio.code}/NONEXIST")
        assert resp.status_code == 404

    def test_other_users_item(self, client, db_session, other_user):
        """다른 유저의 아이템에 접근 불가"""
        cat = Portfolio(
            user_id=other_user.id, code="OCCAT", name="OC", description="D", order=0
        )
        db_session.add(cat)
        db_session.commit()
        item = Project(
            portfolio_id=cat.id, code="OITEM", title="OI", summary="S", order=0,
            description="Other's detail"
        )
        db_session.add(item)
        db_session.commit()

        resp = client.get(f"/api/v1/projects/{cat.code}/{item.code}")
        assert resp.status_code == 404


class TestCreateItemWithDetail:
    """POST /api/v1/projects/ 에서 detail 필드 포함 생성 테스트"""

    def test_create_with_detail_fields(self, client, sample_portfolio):
        """detail 필드를 포함하여 아이템 생성"""
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": sample_portfolio.code,
            "code": "NEWDT",
            "title": "New Detail Item",
            "summary": "Item with detail",
            "description": "Full project description",
            "tech_stack": ["Python", "FastAPI"],
            "screenshots": [{"file_uuid": "abc00000000000000000000000000001", "caption": "Main"}],
            "links": [
                {
                    "name": "github",
                    "url": "https://github.com/project",
                    "background_color": "#333",
                    "text_color": "#fff",
                    "icon": "github"
                }
            ],
            "start_date": "2024-01",
            "end_date": "2024-06",
            "features": ["Feature A", "Feature B"],
        })
        assert resp.status_code == 200

    def test_create_without_detail_fields(self, client, sample_portfolio):
        """detail 필드 없이 아이템 생성"""
        resp = client.post("/api/v1/projects/", json={
            "portfolio_code": sample_portfolio.code,
            "code": "NODET",
            "title": "No Detail Item",
            "summary": "Item without detail",
        })
        assert resp.status_code == 200


class TestUpdateItemWithDetail:
    """PUT /api/v1/projects/{portfolio_code}/{project_code} 에서 detail 필드 수정 테스트"""

    def test_update_detail_fields(self, client, sample_portfolio, sample_item_with_detail):
        """detail 필드 업데이트"""
        url = f"/api/v1/projects/{sample_portfolio.code}/{sample_item_with_detail.code}"
        resp = client.put(url, json={
            "description": "Updated description",
            "tech_stack": ["React", "Node.js"],
        })
        assert resp.status_code == 200

        # 단일 조회로 확인
        resp2 = client.get(url)
        assert resp2.status_code == 200
        data = resp2.get_json()
        assert data["description"] == "Updated description"
        assert data["tech_stack"] == ["React", "Node.js"]

    def test_partial_update_preserves_other_fields(self, client, sample_portfolio, sample_item_with_detail):
        """부분 업데이트 시 다른 필드 유지"""
        url = f"/api/v1/projects/{sample_portfolio.code}/{sample_item_with_detail.code}"
        resp = client.put(url, json={
            "features": ["New Feature"],
        })
        assert resp.status_code == 200

        resp2 = client.get(url)
        data = resp2.get_json()
        assert data["features"] == ["New Feature"]
        assert data["description"] == "Detailed description"  # 변경되지 않음
