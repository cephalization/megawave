import random
from typing import Dict


def getId() -> str:
    """
    Generate an 8 base29-encoded character string

    11 base58 characters are enough for youtube so 8 base29 characters should
    be good enough for me

    I landed on 29 characters that are difficult to build words out of as a
    natural filter (hopefully) against inappropriate URLs
    """

    alphabet = "123456789bcdfghjkmnpqrstvwxyz"  # base29
    size = 8

    id = bytearray(random.getrandbits(8) for _ in range(size))

    try:
        for i, v in enumerate(id):
            id[i] = bytes(alphabet[v % len(alphabet)], "UTF-8")[0]
    except ValueError as e:
        print(f"Could not generate byte: {e}")

    return str(id, "UTF-8")


def filter_by_field(filter: str, target_field: str, target_dict: Dict):
    target_dict_field = target_dict.get(target_field, None)
    if target_dict_field is None:
        return False

    try:
        for value in target_dict_field:
            if value == filter:
                return True
    except TypeError:
        if value == filter:
            return True

    return False
