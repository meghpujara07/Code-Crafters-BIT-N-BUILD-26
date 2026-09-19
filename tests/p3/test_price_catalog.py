"""Unit tests for price_catalog.py."""

from app.adapters.price_catalog import (
    get_hourly_price,
    get_monthly_price,
    get_storage_price_per_gb_month,
    get_next_smaller_size,
    get_next_larger_size,
)


def test_hourly_prices():
    assert get_hourly_price("AWS", "COMPUTE", "t3.small") == 0.0208
    assert get_hourly_price("AWS", "COMPUTE", "t3.medium") == 0.0416
    assert get_hourly_price("AWS", "COMPUTE", "t3.large") == 0.0832
    assert get_hourly_price("AWS", "COMPUTE", "t3.xlarge") == 0.1664
    assert get_hourly_price("AWS", "DATABASE", "db.r5.large") == 0.25
    assert get_hourly_price("AZURE", "COMPUTE", "Standard_D2s_v3") == 0.096
    assert get_hourly_price("GCP", "COMPUTE", "e2-standard-2") == 0.067


def test_monthly_prices():
    # 4 * t3.medium * 730 hours = 121.472 -> 121.47
    monthly_4_medium = get_monthly_price("AWS", "COMPUTE", "t3.medium", quantity=4)
    assert round(monthly_4_medium, 2) == 121.47

    # 6 * t3.medium * 730 hours = 182.208 -> 182.21
    monthly_6_medium = get_monthly_price("AWS", "COMPUTE", "t3.medium", quantity=6)
    assert round(monthly_6_medium, 2) == 182.21


def test_storage_prices():
    assert get_storage_price_per_gb_month("AWS", "DATABASE") == 0.115
    assert get_storage_price_per_gb_month("AWS", "STORAGE", "s3-standard") == 0.023
    assert get_storage_price_per_gb_month("AZURE", "STORAGE", "blob-hot") == 0.0184
    assert get_storage_price_per_gb_month("GCP", "STORAGE", "gcs-nearline") == 0.01


def test_ladders():
    assert get_next_smaller_size("AWS", "COMPUTE", "t3.large") == "t3.medium"
    assert get_next_smaller_size("AWS", "COMPUTE", "t3.medium") == "t3.small"
    assert get_next_smaller_size("AWS", "COMPUTE", "t3.small") is None

    assert get_next_larger_size("AWS", "COMPUTE", "t3.medium") == "t3.large"
    assert get_next_larger_size("AWS", "COMPUTE", "t3.xlarge") is None
