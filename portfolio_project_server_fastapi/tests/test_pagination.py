"""Unit tests for pagination utility"""
import pytest
from models import Portfolio
from utils.pagination import paginate_query


class TestPaginateQuery:
    def test_basic_pagination(self, db_session, test_user):
        """Should paginate query correctly"""
        # Setup: create 25 portfolios
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

        query = db_session.query(Portfolio).filter(
            Portfolio.user_id == test_user.id
        ).order_by(Portfolio.order)

        result = paginate_query(query, page=1, page_size=10)

        assert len(result.items) == 10
        assert result.meta.total == 25
        assert result.meta.page == 1
        assert result.meta.page_size == 10
        assert result.meta.total_pages == 3

    def test_last_page_partial(self, db_session, test_user):
        """Last page with partial items"""
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

        query = db_session.query(Portfolio).filter(
            Portfolio.user_id == test_user.id
        ).order_by(Portfolio.order)

        result = paginate_query(query, page=2, page_size=10)

        assert len(result.items) == 5
        assert result.meta.page == 2
        assert result.meta.total_pages == 2

    def test_empty_result(self, db_session, test_user):
        """Empty query should return empty items"""
        query = db_session.query(Portfolio).filter(
            Portfolio.user_id == test_user.id
        )

        result = paginate_query(query, page=1, page_size=10)

        assert result.items == []
        assert result.meta.total == 0
        assert result.meta.total_pages == 0

    def test_page_beyond_total(self, db_session, test_user):
        """Page beyond total should return empty items"""
        for i in range(5):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        query = db_session.query(Portfolio).filter(
            Portfolio.user_id == test_user.id
        )

        result = paginate_query(query, page=10, page_size=10)

        assert result.items == []
        assert result.meta.total == 5
        assert result.meta.page == 10
        assert result.meta.total_pages == 1

    def test_single_page(self, db_session, test_user):
        """All items fit in single page"""
        for i in range(5):
            cat = Portfolio(
                user_id=test_user.id,
                code=f"CAT{i:02d}",
                name=f"Cat{i}",
                description="D",
                order=i
            )
            db_session.add(cat)
        db_session.commit()

        query = db_session.query(Portfolio).filter(
            Portfolio.user_id == test_user.id
        )

        result = paginate_query(query, page=1, page_size=10)

        assert len(result.items) == 5
        assert result.meta.total_pages == 1
