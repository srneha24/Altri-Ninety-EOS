from math import ceil


class Pagination:
    """Pagination class for handling pagination logic."""

    def __init__(self, page, limit, total_count, data):
        self._total_pages = ceil(total_count / limit)
        self._page = page
        self._count = total_count
        self._page_size = limit
        self.data = data

    @property
    def _next(self) -> int | object:
        """
        Calculating the next page for pagination
        returns int() or None
        """
        if int(self._total_pages) - int(self._page) > 0:
            return self._page + 1
        return

    @property
    def _previous(self) -> int | object:
        """
        Calculating the previous page for pagination
        returns int() or None
        """
        if int(self._total_pages) - int(self._page) >= 0 and int(self._page) - 1 > 0:
            return int(self._page) - 1
        return None

    def get_paginated_data(self) -> dict:
        """
        Generating the pagination data
        return dictionary object
        results (data) will be updated from the view
        """
        data = {
            "total_items": self._count,
            "page": self._page,
            "page_size": self._page_size,
            "next_page": self._next,
            "previous_page": self._previous,
            "page_count": self._total_pages,
            "data": self.data,
        }
        return data
