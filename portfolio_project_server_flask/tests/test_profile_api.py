from models import Portfolio, Profile


class TestProfileApi:
    def test_create_profile_success(self, client):
        resp = client.post("/api/v1/profiles/", json={
            "display_name": "Main Profile",
            "headline": "Builder",
            "bio": "Hello",
            "links": [],
        })

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["display_name"] == "Main Profile"
        assert data["headline"] == "Builder"
        assert data["is_default"] is True

    def test_list_profiles_returns_own_profiles(self, client, db_session, test_user, other_user):
        db_session.add(Profile(user_id=test_user.id, display_name="Mine", is_default=True))
        db_session.add(Profile(user_id=other_user.id, display_name="Theirs", is_default=True))
        db_session.commit()

        resp = client.get("/api/v1/profiles/")

        assert resp.status_code == 200
        data = resp.get_json()
        assert [item["display_name"] for item in data["items"]] == ["Mine"]

    def test_update_default_clears_other_defaults(self, client, db_session, test_user):
        p1 = Profile(user_id=test_user.id, display_name="A", is_default=True)
        p2 = Profile(user_id=test_user.id, display_name="B", is_default=False)
        db_session.add_all([p1, p2])
        db_session.commit()

        resp = client.put(f"/api/v1/profiles/{p2.id}", json={
            "display_name": "B",
            "links": [],
            "is_default": True,
        })

        assert resp.status_code == 200
        db_session.refresh(p1)
        db_session.refresh(p2)
        assert p1.is_default is False
        assert p2.is_default is True

    def test_delete_linked_profile_is_rejected(self, client, db_session, test_user):
        profile = Profile(user_id=test_user.id, display_name="Linked", is_default=True)
        db_session.add(profile)
        db_session.flush()
        db_session.add(Portfolio(
            user_id=test_user.id,
            profile_id=profile.id,
            code="LINKD",
            name="Linked Portfolio",
            description="D",
        ))
        db_session.commit()

        resp = client.delete(f"/api/v1/profiles/{profile.id}")

        assert resp.status_code == 409


class TestPortfolioProfileLink:
    def test_create_portfolio_with_profile(self, client, db_session, test_user):
        profile = Profile(user_id=test_user.id, display_name="Public", is_default=True)
        db_session.add(profile)
        db_session.commit()

        resp = client.post("/api/v1/portfolios/", json={
            "code": "PROFL",
            "name": "With Profile",
            "description": "D",
            "profile_id": profile.id,
        })

        assert resp.status_code == 200
        assert resp.get_json()["profile_id"] == profile.id

    def test_create_portfolio_rejects_other_user_profile(self, client, db_session, other_user):
        profile = Profile(user_id=other_user.id, display_name="Other", is_default=True)
        db_session.add(profile)
        db_session.commit()

        resp = client.post("/api/v1/portfolios/", json={
            "code": "BADPF",
            "name": "Bad Profile",
            "description": "D",
            "profile_id": profile.id,
        })

        assert resp.status_code == 400
