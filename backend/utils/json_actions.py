import collections
from datetime import date, datetime, time


def simplify_json(obj):
    """Converts objects in a dict/list that are not JSON encodable into JSON encodable objects"""

    def convert_to_basic(o):
        if isinstance(o, dict):
            return {k: convert_to_basic(v) for k, v in o.items()}
        elif isinstance(o, (list, collections.deque)):
            return [convert_to_basic(e) for e in o]
        elif isinstance(o, (datetime, date, time)):
            return o.isoformat()
        else:
            return o

    return convert_to_basic(obj)
