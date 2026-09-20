import pytest

from app.api.v1.cloud_accounts import _credentials, _validate as validate_account
from app.api.v1.policies import _validate_policy, _validate_rules
from app.api.v1.users import _validate_create, _validate_patch
from app.api.v1.budgets import _validate as validate_budget
from app.core.errors import ApiError


def assert_400(fn, *args, **kwargs):
    with pytest.raises(ApiError) as exc:
        fn(*args, **kwargs)
    assert exc.value.status == 400
    assert exc.value.code == "VALIDATION_ERROR"


def test_users_create_and_patch_validation_edges():
    assert_400(_validate_create, {"email": "a@b.com"})
    assert_400(_validate_create, {"email": "a@b.com", "name": "A", "role": "NOPE", "password": "x"})
    assert_400(_validate_create, {"email": "a@b.com", "name": "A", "role": "ADMIN", "password": "", "extra": 1})
    _validate_create({"email": "a@b.com", "name": "A", "role": "ADMIN", "password": "x"})
    assert_400(_validate_patch, {})
    assert_400(_validate_patch, {"email": "new@b.com"})
    assert_400(_validate_patch, {"active": "false"})
    assert_400(_validate_patch, {"role": "NOPE"})
    _validate_patch({"active": False})


def test_cloud_account_validation_edges():
    assert_400(validate_account, {"provider": "AWS", "name": "x", "externalAccountId": "a", "regions": [], "mode": "MOCK"})
    assert_400(validate_account, {"provider": "AWS", "name": "x", "externalAccountId": "a", "regions": ["us-east-1"], "mode": "LIVE"})
    assert_400(validate_account, {"provider": "AWS", "name": "x", "externalAccountId": "a", "regions": ["us-east-1"], "mode": "BAD"})
    assert_400(validate_account, {"provider": "AWS", "name": "x", "externalAccountId": "a", "regions": ["us-east-1"], "mode": "LIVE",
                                  "credentials": {"authType": "BAD", "accessKeyId": "a", "secretAccessKey": "s"}})
    assert_400(validate_account, {"provider": "AWS", "name": "x", "externalAccountId": "a", "regions": ["us-east-1"], "mode": "MOCK",
                                  "bad": True})
    provider, name, regions, mode, creds = validate_account({
        "provider": "AWS", "name": "x", "externalAccountId": "a",
        "regions": ["us-east-1"], "mode": "LIVE",
        "credentials": {"authType": "ACCESS_KEY", "accessKeyId": "a", "secretAccessKey": "s"},
    })
    assert (provider, name, regions, mode) == ("AWS", "x", ["us-east-1"], "LIVE")
    assert creds["secretAccessKey"] == "s"


@pytest.mark.parametrize("provider,body", [
    ("AWS", {"authType": "ACCESS_KEY", "accessKeyId": "a", "secretAccessKey": "s"}),
    ("AWS", {"authType": "ASSUME_ROLE", "roleArn": "arn", "externalId": "ext"}),
    ("AZURE", {"tenantId": "t", "clientId": "c", "clientSecret": "s", "subscriptionId": "sub"}),
    ("GCP", {"projectId": "p", "serviceAccountJson": "{}"}),
])
def test_cloud_credentials_valid(provider, body):
    assert _credentials(body, provider) == body


def test_policy_safety_rules_all_supported_shapes():
    rules = {
        "maxInstances": 10,
        "minInstances": 1,
        "maxScaleStepPercent": 50,
        "maxCostIncreasePerActionUsd": 100.5,
        "blockedActions": ["STOP"],
        "allowedWindows": [{"days": [0, 1, 6], "startHour": 9, "endHour": 18, "timezone": "UTC"}],
    }
    assert _validate_rules("SAFETY_LIMIT", rules) == rules
    assert_400(_validate_rules, "SAFETY_LIMIT", {"maxInstances": -1})
    assert_400(_validate_rules, "SAFETY_LIMIT", {"maxScaleStepPercent": 101})
    assert_400(_validate_rules, "SAFETY_LIMIT", {"blockedActions": ["NOPE"]})
    assert_400(_validate_rules, "SAFETY_LIMIT", {"allowedWindows": [{"days": [7], "startHour": 0, "endHour": 1, "timezone": "UTC"}]})
    assert_400(_validate_rules, "SAFETY_LIMIT", {"unknown": 1})


def test_policy_approval_rules_are_or_combined_and_strictly_shaped():
    rules = {"requireApprovalWhen": {"costDeltaMonthlyUsdGt": 50, "actionTypeIn": ["SCALE_OUT"]}, "approverRole": "MANAGER"}
    assert _validate_rules("APPROVAL_RULE", rules) == rules
    assert_400(_validate_rules, "APPROVAL_RULE", {"requireApprovalWhen": {}, "approverRole": "MANAGER"})
    assert_400(_validate_rules, "APPROVAL_RULE", {"requireApprovalWhen": {"actionTypeIn": []}, "approverRole": "MANAGER"})
    assert_400(_validate_rules, "APPROVAL_RULE", {"requireApprovalWhen": {"costDeltaMonthlyUsdGt": 1}, "approverRole": "VIEWER"})


def test_policy_final_state_validation_on_patch():
    body = {
        "name": "Safety", "type": "SAFETY_LIMIT", "enabled": True, "priority": 10,
        "scope": {}, "rules": {"maxInstances": 10},
    }
    name, ptype, enabled, priority, scope, rules = _validate_policy(body)
    assert (name, ptype, enabled, priority, scope, rules["maxInstances"]) == ("Safety", "SAFETY_LIMIT", True, 10, {}, 10)


def test_budget_validation_edges():
    valid = {
        "name": "AWS", "scope": "PROVIDER", "scopeValue": "AWS",
        "amountUsd": 1500, "period": "MONTHLY", "alertThresholds": [80, 100], "hardLimit": True,
    }
    assert validate_budget(valid)[1] == "PROVIDER"
    for bad in [
        {**valid, "scope": "GLOBAL", "scopeValue": "AWS"},
        {**valid, "scope": "PROVIDER", "scopeValue": "NOPE"},
        {**valid, "scope": "ACCOUNT", "scopeValue": "not-a-uuid"},
        {**valid, "scope": "TAG", "scopeValue": "missingcolon"},
        {**valid, "amountUsd": -1},
        {**valid, "period": "YEARLY"},
        {**valid, "alertThresholds": [101]},
        {**valid, "hardLimit": "true"},
        {**valid, "unknown": 1},
    ]:
        assert_400(validate_budget, bad)


def test_policy_body_unknown_and_empty_cases():
    assert_400(_validate_policy, {})
    assert_400(_validate_policy, {"name": "x", "type": "SAFETY_LIMIT", "enabled": True, "priority": 1, "scope": {}, "rules": {}, "extra": 1})
