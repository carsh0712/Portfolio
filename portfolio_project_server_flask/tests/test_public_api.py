"""/api/v1/public/* 엔드포인트 통합 테스트."""

import pytest
from models import Portfolio, Profile, Project, UploadFile


class TestGetPublicProjects:
    """GET /api/v1/public/{username}/{portfolio_code}/ 테스트"""

    def test_success_with_public_items(self, auth_client, db_session, test_user):
        """공개 포트폴리오의 공개 아이템 조회 성공"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="WEBAP",
            name="Web Apps",
            description="My web applications",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item1 = Project(
            portfolio_id=portfolio.id,
            code="ITEM1",
            title="Public Item 1",
            summary="First public item",
            tags=["python"],
            order=0,
            is_public=True,
        )
        item2 = Project(
            portfolio_id=portfolio.id,
            code="ITEM2",
            title="Public Item 2",
            summary="Second public item",
            tags=["fastapi"],
            order=1,
            is_public=True,
        )
        db_session.add_all([item1, item2])
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/WEBAP/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 2
        assert data[0]["title"] == "Public Item 1"
        assert data[1]["title"] == "Public Item 2"

    def test_filter_private_items(self, auth_client, db_session, test_user):
        """비공개 아이템은 필터링됨"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="MIXED",
            name="Mixed Items",
            description="Mixed public and private items",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        public_item = Project(
            portfolio_id=portfolio.id,
            code="PUBLIC",
            title="Public Item",
            summary="This is public",
            tags=[],
            order=0,
            is_public=True,
        )
        private_item = Project(
            portfolio_id=portfolio.id,
            code="PRIVATE",
            title="Private Item",
            summary="This is private",
            tags=[],
            order=1,
            is_public=False,
        )
        db_session.add_all([public_item, private_item])
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/MIXED/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["title"] == "Public Item"

    def test_empty_public_items(self, auth_client, db_session, test_user):
        """공개 포트폴리오이지만 공개 아이템이 없는 경우 빈 리스트 반환"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="EMPTY",
            name="Empty Portfolio",
            description="No public items",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/EMPTY/")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 0

    def test_user_not_found(self, auth_client):
        """존재하지 않는 username"""
        resp = auth_client.get("/api/v1/public/nonexistentuser/WEBAP/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "User not found"

    def test_portfolio_not_found(self, auth_client, test_user):
        """존재하지 않는 portfolio_code"""
        resp = auth_client.get(f"/api/v1/public/{test_user.username}/NONEXIST/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public portfolio not found"

    def test_private_portfolio_not_accessible(self, auth_client, db_session, test_user):
        """비공개 포트폴리오는 접근 불가"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="PRIV1",
            name="Private Portfolio",
            description="This is private",
            order=0,
            is_public=False,
        )
        db_session.add(portfolio)
        db_session.commit()

        item = Project(
            portfolio_id=portfolio.id,
            code="PUBITEM",
            title="Public Item in Private Portfolio",
            summary="This should not be accessible",
            tags=[],
            order=0,
            is_public=True,
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/PRIV1/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public portfolio not found"

    def test_items_ordered_by_order_field(self, auth_client, db_session, test_user):
        """아이템이 order 필드로 정렬되어 반환됨"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="ORDER",
            name="Ordered Items",
            description="Items with specific order",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item3 = Project(
            portfolio_id=portfolio.id, code="ITEM3", title="Item 3",
            summary="Third", order=2, is_public=True,
        )
        item1 = Project(
            portfolio_id=portfolio.id, code="ITEM1", title="Item 1",
            summary="First", order=0, is_public=True,
        )
        item2 = Project(
            portfolio_id=portfolio.id, code="ITEM2", title="Item 2",
            summary="Second", order=1, is_public=True,
        )
        db_session.add_all([item3, item1, item2])
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/ORDER/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 3
        assert data[0]["title"] == "Item 1"
        assert data[1]["title"] == "Item 2"
        assert data[2]["title"] == "Item 3"

    def test_no_authentication_required(self, auth_client, db_session, test_user):
        """인증 없이 접근 가능"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="NOAUTH",
            name="No Auth Required",
            description="Public access",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="NOAUTH",
            title="Public Item",
            summary="No auth needed",
            order=0,
            is_public=True,
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/NOAUTH/")
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1


class TestGetPublicPortfolioProfile:
    def test_success_with_linked_profile(self, auth_client, db_session, test_user):
        profile = Profile(
            user_id=test_user.id,
            display_name="Public Name",
            email="public@example.com",
            headline="Public headline",
            bio="Public bio",
            links=[],
            extra_fields=[
                {
                    "key": "role",
                    "label": "Role",
                    "value": "Builder",
                    "type": "text",
                    "is_public": True,
                    "order": 1,
                },
                {
                    "key": "private_note",
                    "label": "Private",
                    "value": "Hidden in UI",
                    "type": "text",
                    "is_public": False,
                    "order": 2,
                },
            ],
            is_default=True,
        )
        db_session.add(profile)
        db_session.flush()
        portfolio = Portfolio(
            user_id=test_user.id,
            profile_id=profile.id,
            code="PROFL",
            name="Profile Portfolio",
            description="D",
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/PROFL/profile")

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["display_name"] == "Public Name"
        assert data["email"] == "public@example.com"
        assert data["headline"] == "Public headline"
        assert data["extra_fields"][0]["key"] == "role"
        assert len(data["extra_fields"]) == 1

    def test_returns_none_without_profile(self, auth_client, db_session, test_user):
        db_session.add(Portfolio(
            user_id=test_user.id,
            code="NOPRF",
            name="No Profile",
            description="D",
            is_public=True,
        ))
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/NOPRF/profile")

        assert resp.status_code == 200
        assert resp.get_json() is None


class TestGetPublicProjectDetail:
    """GET /api/v1/public/{username}/{portfolio_code}/{project_code}/ 테스트"""

    def test_success_with_public_item_detail(self, auth_client, db_session, test_user):
        """공개 포트폴리오 아이템 상세 조회 성공"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="WEBAP",
            name="Web Apps",
            description="My web applications",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="ECOMM",
            title="E-Commerce Platform",
            summary="A full-stack e-commerce solution",
            tags=["React", "Node.js"],
            order=0,
            is_public=True,
            description="Detailed description of e-commerce platform",
            tech_stack=["React", "Node.js", "MongoDB"],
            screenshots=[{"file_uuid": "abc00000000000000000000000000001", "caption": "Screenshot 1"}],
            links=[
                {
                    "name": "github",
                    "url": "https://github.com/example",
                    "background_color": "#333",
                    "text_color": "#fff",
                    "icon": "github"
                }
            ],
            start_date="2024-01",
            end_date="2024-06",
            features=["Feature 1", "Feature 2"],
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/WEBAP/ECOMM/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["title"] == "E-Commerce Platform"
        assert data["description"] == "Detailed description of e-commerce platform"
        assert data["tech_stack"] == ["React", "Node.js", "MongoDB"]
        assert len(data["screenshots"]) == 1
        assert len(data["links"]) == 1
        assert data["features"] == ["Feature 1", "Feature 2"]

    def test_user_not_found(self, auth_client):
        """존재하지 않는 username"""
        resp = auth_client.get("/api/v1/public/nonexistentuser/WEBAP/ECOMM/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "User not found"

    def test_portfolio_not_found(self, auth_client, test_user):
        """존재하지 않는 portfolio_code"""
        resp = auth_client.get(f"/api/v1/public/{test_user.username}/NONEXIST/ECOMM/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public portfolio not found"

    def test_project_code_not_found(self, auth_client, db_session, test_user):
        """존재하지 않는 project_code"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="WEBAP",
            name="Web Apps",
            description="My web applications",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/WEBAP/NONEXIST/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public project item not found"

    def test_private_portfolio_not_accessible(self, auth_client, db_session, test_user):
        """비공개 포트폴리오의 아이템은 접근 불가"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="PRIV1",
            name="Private Portfolio",
            description="This is private",
            order=0,
            is_public=False,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="PUBITEM",
            title="Public Item",
            summary="This should not be accessible",
            tags=[],
            order=0,
            is_public=True,
            description="Detail description",
            tech_stack=["Python"],
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/PRIV1/PUBITEM/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public portfolio not found"

    def test_private_item_not_accessible(self, auth_client, db_session, test_user):
        """비공개 아이템은 접근 불가"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="WEBAP",
            name="Web Apps",
            description="My web applications",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="PRIVITEM",
            title="Private Item",
            summary="This is private",
            tags=[],
            order=0,
            is_public=False,
            description="Detail description",
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/WEBAP/PRIVITEM/")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "Public project item not found"

    def test_item_without_detail_still_accessible(self, auth_client, db_session, test_user):
        """detail 필드 없는 공개 아이템도 조회 가능"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="WEBAP",
            name="Web Apps",
            description="My web applications",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="NODETAIL",
            title="Item Without Detail",
            summary="This item has no detail",
            tags=[],
            order=0,
            is_public=True,
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/WEBAP/NODETAIL/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["description"] is None

    def test_no_authentication_required(self, auth_client, db_session, test_user):
        """인증 없이 접근 가능"""
        portfolio = Portfolio(
            user_id=test_user.id,
            code="NOAUTH",
            name="No Auth Required",
            description="Public access",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        item = Project(
            portfolio_id=portfolio.id,
            code="PUBITEM",
            title="Public Item",
            summary="No auth needed",
            tags=[],
            order=0,
            is_public=True,
            description="Public detail",
            tech_stack=["Python"],
        )
        db_session.add(item)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/NOAUTH/PUBITEM/")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["title"] == "Public Item"
        assert data["description"] == "Public detail"


class TestGetPublicFile:
    """GET /api/v1/public/{username}/file/{file_uuid} 테스트"""

    def _create_file(self, db_session, user, tmp_path, name="test.png", content=b"fake image content"):
        file_path = tmp_path / name
        file_path.write_bytes(content)

        db_file = UploadFile(
            user_id=user.id,
            original_filename=name,
            stored_filename=f"stored_{name}",
            file_size=len(content),
            content_type="image/png",
            upload_path=str(file_path),
        )
        db_session.add(db_file)
        db_session.commit()
        db_session.refresh(db_file)
        return db_file

    def test_success(self, auth_client, db_session, test_user, tmp_path):
        """공개 파일 다운로드 성공"""
        db_file = self._create_file(db_session, test_user, tmp_path)
        portfolio = Portfolio(
            user_id=test_user.id,
            code="PUBFL",
            name="Public File Portfolio",
            description="Public file reference",
            file_uuid=db_file.uuid,
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 200
        assert resp.data == b"fake image content"
        assert "max-age=86400" in resp.headers.get("cache-control", "")

    def test_success_with_public_project_thumbnail(self, auth_client, db_session, test_user, tmp_path):
        db_file = self._create_file(db_session, test_user, tmp_path, name="thumbnail.png", content=b"thumbnail")
        portfolio = Portfolio(
            user_id=test_user.id,
            code="THUMB",
            name="Thumbnail Portfolio",
            description="Public portfolio",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id,
            code="THUMBITEM",
            title="Thumbnail Item",
            summary="Uses thumbnail",
            thumbnail_file_uuid=db_file.uuid,
            order=0,
            is_public=True,
        )
        db_session.add(project)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 200
        assert resp.data == b"thumbnail"

    def test_success_with_public_project_screenshot(self, auth_client, db_session, test_user, tmp_path):
        db_file = self._create_file(db_session, test_user, tmp_path, name="screenshot.png", content=b"screenshot")
        portfolio = Portfolio(
            user_id=test_user.id,
            code="SHOT1",
            name="Screenshot Portfolio",
            description="Public portfolio",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id,
            code="SHOTITEM",
            title="Screenshot Item",
            summary="Uses screenshot",
            screenshots=[{"file_uuid": db_file.uuid, "caption": "Main"}],
            order=0,
            is_public=True,
        )
        db_session.add(project)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 200
        assert resp.data == b"screenshot"

    def test_file_not_publicly_referenced(self, auth_client, db_session, test_user, tmp_path):
        db_file = self._create_file(db_session, test_user, tmp_path)

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "File not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_file_referenced_by_private_portfolio(self, auth_client, db_session, test_user, tmp_path):
        db_file = self._create_file(db_session, test_user, tmp_path)
        portfolio = Portfolio(
            user_id=test_user.id,
            code="PRVFL",
            name="Private File Portfolio",
            description="Private file reference",
            file_uuid=db_file.uuid,
            order=0,
            is_public=False,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "File not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_file_referenced_by_private_project(self, auth_client, db_session, test_user, tmp_path):
        db_file = self._create_file(db_session, test_user, tmp_path)
        portfolio = Portfolio(
            user_id=test_user.id,
            code="PUBPF",
            name="Public Portfolio Private Project",
            description="Public portfolio",
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()
        db_session.refresh(portfolio)

        project = Project(
            portfolio_id=portfolio.id,
            code="PRIVATEITEM",
            title="Private Item",
            summary="Private project",
            thumbnail_file_uuid=db_file.uuid,
            order=0,
            is_public=False,
        )
        db_session.add(project)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "File not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_user_not_found(self, auth_client):
        """존재하지 않는 username"""
        resp = auth_client.get("/api/v1/public/nonexistentuser/file/00000000000000000000000000000999")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "User not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_file_not_found(self, auth_client, test_user):
        """존재하지 않는 file_uuid"""
        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/00000000000000000000000000000999")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "File not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_file_belongs_to_other_user(self, auth_client, db_session, test_user, other_user, tmp_path):
        """다른 사용자의 파일은 접근 불가"""
        file_path = tmp_path / "other.png"
        file_path.write_bytes(b"other user file")

        db_file = UploadFile(
            user_id=other_user.id,
            original_filename="other.png",
            stored_filename="other_stored.png",
            file_size=15,
            content_type="image/png",
            upload_path=str(file_path),
        )
        db_session.add(db_file)
        db_session.commit()
        db_session.refresh(db_file)

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "File not found"
        assert resp.headers.get("cache-control") == "no-store"

    def test_file_on_disk_missing(self, auth_client, db_session, test_user):
        """DB에는 있지만 디스크에 파일이 없는 경우"""
        db_file = UploadFile(
            user_id=test_user.id,
            original_filename="missing.png",
            stored_filename="missing_stored.png",
            file_size=100,
            content_type="image/png",
            upload_path="/nonexistent/path/missing.png",
        )
        db_session.add(db_file)
        db_session.commit()
        db_session.refresh(db_file)

        portfolio = Portfolio(
            user_id=test_user.id,
            code="MISSF",
            name="Missing File Portfolio",
            description="References a missing file",
            file_uuid=db_file.uuid,
            order=0,
            is_public=True,
        )
        db_session.add(portfolio)
        db_session.commit()

        resp = auth_client.get(f"/api/v1/public/{test_user.username}/file/{db_file.uuid}")
        assert resp.status_code == 404
        assert resp.get_json()["detail"] == "파일을 찾을 수 없습니다."
        assert resp.headers.get("cache-control") == "no-store"
