"""Price Catalog and Right-Sizing Ladders for CloudOps.

Single source of truth for resource pricing ($/hour and $/GB-month) and size ladders.
Derived from ARCHITECTURE.md §11.
"""

from typing import Optional

# Hourly prices ($/hour) for compute, database, container, load balancer
HOURLY_PRICES: dict[tuple[str, str, str], float] = {
    # AWS Compute
    ("AWS", "COMPUTE", "t3.small"): 0.0208,
    ("AWS", "COMPUTE", "t3.medium"): 0.0416,
    ("AWS", "COMPUTE", "t3.large"): 0.0832,
    ("AWS", "COMPUTE", "t3.xlarge"): 0.1664,
    # AWS Database
    ("AWS", "DATABASE", "db.r5.large"): 0.25,
    ("AWS", "DATABASE", "db.r5.xlarge"): 0.50,
    # AWS Fixed
    ("AWS", "LOAD_BALANCER", "alb"): 22.63 / 730.0,  # ~0.031 $/h ($22.63/mo)
    # Azure Compute
    ("AZURE", "COMPUTE", "Standard_D2s_v3"): 0.096,
    ("AZURE", "COMPUTE", "Standard_D4s_v3"): 0.192,
    ("AZURE", "COMPUTE", "Standard_D8s_v3"): 0.384,
    ("AZURE", "CONTAINER", "Standard_D4s_v3"): 0.192,
    ("AZURE", "CONTAINER", "Standard_D8s_v3"): 0.384,
    # Azure Database
    ("AZURE", "DATABASE", "GP_Gen5_2"): 0.25,
    ("AZURE", "DATABASE", "GP_Gen5_4"): 0.50,
    ("AZURE", "DATABASE", "GP_Gen5_8"): 1.00,
    # GCP Compute
    ("GCP", "COMPUTE", "e2-standard-2"): 0.067,
    ("GCP", "COMPUTE", "e2-standard-4"): 0.134,
    ("GCP", "COMPUTE", "e2-standard-8"): 0.268,
    # GCP Container
    ("GCP", "CONTAINER", "n2-standard-4"): 0.194,
    ("GCP", "CONTAINER", "n2-standard-8"): 0.388,
    # GCP Fixed
    ("GCP", "DATABASE", "m1-standard"): 146.00 / 730.0,  # ~0.20 $/h ($146.00/mo)
}

# Fixed monthly costs ($/month)
FIXED_MONTHLY_COSTS: dict[tuple[str, str, str], float] = {
    ("AWS", "LOAD_BALANCER", "alb"): 22.63,
    ("GCP", "DATABASE", "m1-standard"): 146.00,
}

# Storage prices ($/GB-month)
STORAGE_PRICES_PER_GB_MONTH: dict[tuple[str, str, str], float] = {
    ("AWS", "DATABASE", "per_gb_month"): 0.115,
    ("AWS", "STORAGE", "s3-standard"): 0.023,
    ("AZURE", "DATABASE", "per_gb_month"): 0.115,
    ("AZURE", "STORAGE", "blob-hot"): 0.0184,
    ("GCP", "STORAGE", "gcs-nearline"): 0.01,
}

# Size ladders (ordered small to large)
LADDERS: dict[tuple[str, str], list[str]] = {
    ("AWS", "COMPUTE"): ["t3.small", "t3.medium", "t3.large", "t3.xlarge"],
    ("AWS", "DATABASE"): ["db.r5.large", "db.r5.xlarge"],
    ("AZURE", "COMPUTE"): ["Standard_D2s_v3", "Standard_D4s_v3", "Standard_D8s_v3"],
    ("AZURE", "CONTAINER"): ["Standard_D4s_v3", "Standard_D8s_v3"],
    ("AZURE", "DATABASE"): ["GP_Gen5_2", "GP_Gen5_4", "GP_Gen5_8"],
    ("GCP", "COMPUTE"): ["e2-standard-2", "e2-standard-4", "e2-standard-8"],
    ("GCP", "CONTAINER"): ["n2-standard-4", "n2-standard-8"],
}


def get_hourly_price(provider: str, resource_type: str, size: str) -> float:
    """Get hourly price in USD for a resource size.

    Returns 0.0 if not found.
    """
    key = (provider.upper(), resource_type.upper(), size)
    return HOURLY_PRICES.get(key, 0.0)


def get_monthly_price(provider: str, resource_type: str, size: str, quantity: int = 1) -> float:
    """Get monthly price in USD for a resource (730 hours per month)."""
    key = (provider.upper(), resource_type.upper(), size)
    if key in FIXED_MONTHLY_COSTS:
        return FIXED_MONTHLY_COSTS[key] * quantity
    hourly = get_hourly_price(provider, resource_type, size)
    return hourly * 730.0 * quantity


def get_storage_price_per_gb_month(provider: str, resource_type: str, size: str = "") -> float:
    """Get monthly price per GB in USD."""
    prov = provider.upper()
    rtype = resource_type.upper()
    if (prov, rtype, size) in STORAGE_PRICES_PER_GB_MONTH:
        return STORAGE_PRICES_PER_GB_MONTH[(prov, rtype, size)]
    if (prov, rtype, "per_gb_month") in STORAGE_PRICES_PER_GB_MONTH:
        return STORAGE_PRICES_PER_GB_MONTH[(prov, rtype, "per_gb_month")]
    return 0.0


def get_next_smaller_size(provider: str, resource_type: str, current_size: str) -> Optional[str]:
    """Get the next smaller size on the ladder for right-sizing.

    Returns None if current_size is already smallest or not on a ladder.
    """
    ladder = LADDERS.get((provider.upper(), resource_type.upper()))
    if not ladder or current_size not in ladder:
        return None
    idx = ladder.index(current_size)
    if idx > 0:
        return ladder[idx - 1]
    return None


def get_next_larger_size(provider: str, resource_type: str, current_size: str) -> Optional[str]:
    """Get the next larger size on the ladder.

    Returns None if current_size is already largest or not on a ladder.
    """
    ladder = LADDERS.get((provider.upper(), resource_type.upper()))
    if not ladder or current_size not in ladder:
        return None
    idx = ladder.index(current_size)
    if idx < len(ladder) - 1:
        return ladder[idx + 1]
    return None
